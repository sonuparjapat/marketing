const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { razorpay, isConfigured } = require('../../config/razorpay');
const { sendMail } = require('../../config/mailer');
const { invoiceSent } = require('../../utils/emailTemplates');
const { nextInvoiceNumber, markInvoicePaid, logInvoiceEvent } = require('./invoices.service');

const listInvoices = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.client_id) {
    params.push(req.query.client_id);
    conditions.push(`i.client_id = $${params.length}`);
  }
  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`i.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM invoices i ${where}`, params);
  const dataResult = await pool.query(
    `SELECT i.*, c.name AS client_name FROM invoices i JOIN clients c ON c.id = i.client_id
     ${where} ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const getInvoice = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT i.*, c.name AS client_name FROM invoices i JOIN clients c ON c.id = i.client_id WHERE i.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Invoice not found', 404);
  ok(res, result.rows[0]);
});

const createInvoice = asyncHandler(async (req, res) => {
  const { client_id, project_id, description, amount_paise, due_date } = req.body;
  if (!client_id) return fail(res, 'client_id is required', 400);
  if (!amount_paise || amount_paise <= 0) return fail(res, 'amount_paise must be greater than zero', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invoiceNumber = await nextInvoiceNumber(client);
    const result = await client.query(
      `INSERT INTO invoices (client_id, project_id, invoice_number, description, amount_paise, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [client_id, project_id || null, invoiceNumber, description || null, amount_paise, due_date || null]
    );
    await client.query('COMMIT');
    ok(res, result.rows[0], 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Race-guarded: the UPDATE (draft -> sent) is the mutex, executed BEFORE calling Razorpay — only
// if a row comes back does this proceed to create a payment link, so two concurrent clicks can
// never create two payment links for one invoice (the second UPDATE simply matches zero rows).
const sendInvoice = asyncHandler(async (req, res) => {
  if (!isConfigured) return fail(res, 'Payments are not configured yet', 503);

  const guarded = await pool.query(`UPDATE invoices SET status = 'sent' WHERE id = $1 AND status = 'draft' RETURNING *`, [
    req.params.id,
  ]);
  if (!guarded.rows[0]) {
    const existing = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return fail(res, 'Invoice not found', 404);
    return fail(res, `This invoice is already ${existing.rows[0].status} — only a draft can be sent`, 400);
  }
  const invoice = guarded.rows[0];

  const clientResult = await pool.query('SELECT name, email, phone FROM clients WHERE id = $1', [invoice.client_id]);
  const client = clientResult.rows[0];
  if (!client?.email) {
    // Roll the guarded status back — sending genuinely failed, don't leave it stuck as 'sent' with
    // no way to actually reach the client.
    await pool.query(`UPDATE invoices SET status = 'draft' WHERE id = $1`, [invoice.id]);
    return fail(res, 'This client has no email on file — add one before sending', 400);
  }

  const link = await razorpay.paymentLink.create({
    amount: invoice.amount_paise,
    currency: 'INR',
    description: invoice.description || `Invoice ${invoice.invoice_number}`,
    customer: { name: client.name, email: client.email, contact: client.phone || undefined },
    notify: { email: true, sms: Boolean(client.phone) },
    reference_id: invoice.invoice_number,
  });

  const updated = await pool.query(
    `UPDATE invoices SET razorpay_payment_link_id = $1, razorpay_payment_link_url = $2 WHERE id = $3 RETURNING *`,
    [link.id, link.short_url, invoice.id]
  );
  await logInvoiceEvent(pool, {
    event_type: 'invoice_sent',
    invoice_id: invoice.id,
    metadata: { razorpay_payment_link_id: link.id },
  });

  sendMail({
    to: client.email,
    subject: `Invoice ${invoice.invoice_number}`,
    html: invoiceSent(client.name, invoice.invoice_number, invoice.amount_paise, link.short_url),
  }).catch((e) => console.error('[mailer] invoice email failed:', e.message));

  ok(res, updated.rows[0]);
});

// Manual/offline payment (bank transfer, cash, etc.) — restricted to an invoice that's actually
// been sent, matching the STATUSES-whitelist idiom from support_tickets.
const markPaidManual = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [req.params.id]);
    const invoice = result.rows[0];
    if (!invoice) {
      await client.query('ROLLBACK');
      return fail(res, 'Invoice not found', 404);
    }
    if (!['sent', 'overdue'].includes(invoice.status)) {
      await client.query('ROLLBACK');
      return fail(res, `Only a sent or overdue invoice can be marked paid manually (this one is ${invoice.status})`, 400);
    }

    const { invoice: updatedInvoice } = await markInvoicePaid(client, invoice, { method: req.body.method || 'manual' });
    await client.query('COMMIT');
    ok(res, updatedInvoice);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Cancel only — no delete route on invoices/invoice_payments/invoice_payment_logs at all, they're
// financial records. Blocked once paid (use a refund process outside this feature, same as this
// codebase's existing subscription payments refund is a distinct admin action, not a status edit).
const cancelInvoice = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE invoices SET status = 'cancelled' WHERE id = $1 AND status != 'paid' RETURNING *`,
    [req.params.id]
  );
  if (!result.rows[0]) {
    const existing = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return fail(res, 'Invoice not found', 404);
    return fail(res, 'A paid invoice cannot be cancelled', 400);
  }
  ok(res, result.rows[0]);
});

module.exports = { listInvoices, getInvoice, createInvoice, sendInvoice, markPaidManual, cancelInvoice };
