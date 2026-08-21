const pool = require('../../config/db');
const { sendMail } = require('../../config/mailer');
const { invoicePaymentReceived } = require('../../utils/emailTemplates');
const { notifyAdmins } = require('../../utils/notifyAdmins');

async function nextInvoiceNumber(client) {
  const result = await client.query(`SELECT nextval('invoice_number_seq') AS n`);
  return `INV-${String(result.rows[0].n).padStart(5, '0')}`;
}

async function logInvoiceEvent(client, { event_type, invoice_id, razorpay_payment_id = null, metadata = {} }) {
  await client.query(
    `INSERT INTO invoice_payment_logs (event_type, invoice_id, razorpay_payment_id, metadata) VALUES ($1, $2, $3, $4)`,
    [event_type, invoice_id, razorpay_payment_id, JSON.stringify(metadata)]
  );
}

// The single locked entry point for "an invoice got paid" — called from both the manual/offline
// mark-paid controller handler and the Razorpay webhook branch, exactly like grantSubscription()
// is shared between the subscriptions verify endpoint and its webhook.
//
// UNLIKE the subscriptions case, an invoice already marked 'paid' when this is called again is NOT
// a duplicate delivery of the same event — subscriptions only ever has one payer with one session,
// but an invoice can legitimately be paid via Razorpay AND separately via a manual bank transfer.
// A second "paid" here is evidence of a genuine double payment, not something to silently no-op:
// still record the attempt (both audit tables), then notify a human instead of losing the fact
// that money moved twice.
async function markInvoicePaid(client, invoice, { method, razorpay_payment_link_id = null, razorpay_payment_id = null }) {
  const alreadyPaid = invoice.status === 'paid';

  await client.query(
    `INSERT INTO invoice_payments (invoice_id, method, razorpay_payment_link_id, razorpay_payment_id, amount_paise, status)
     VALUES ($1, $2, $3, $4, $5, 'paid')`,
    [invoice.id, method, razorpay_payment_link_id, razorpay_payment_id, invoice.amount_paise]
  );
  await logInvoiceEvent(client, {
    event_type: alreadyPaid ? 'invoice_overpaid' : 'invoice_paid',
    invoice_id: invoice.id,
    razorpay_payment_id,
    metadata: { method },
  });

  if (alreadyPaid) {
    notifyAdmins('invoice_overpaid', {
      title: 'Invoice paid twice',
      body: `Invoice ${invoice.invoice_number} received a second payment (${method}) after already being marked paid — check for a refund.`,
      data: { invoice_id: invoice.id, invoice_number: invoice.invoice_number },
    }).catch((e) => console.error('[notifications] invoice_overpaid failed:', e.message));
    return { invoice, alreadyPaid: true };
  }

  const updated = await client.query(
    `UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *`,
    [invoice.id]
  );
  notifyAdmins('invoice_paid', {
    title: 'Invoice paid',
    body: `${invoice.invoice_number} — ₹${(invoice.amount_paise / 100).toLocaleString('en-IN')}`,
    data: { invoice_id: invoice.id, invoice_number: invoice.invoice_number },
  }).catch((e) => console.error('[notifications] invoice_paid failed:', e.message));

  return { invoice: updated.rows[0], alreadyPaid: false };
}

// Called from the razorpayWebhook.js dispatcher's `payment_link.paid` branch — mirrors the
// SELECT ... FOR UPDATE + status-recheck idempotency of the subscriptions webhook branch exactly.
async function handlePaymentLinkWebhook(pgClient, entity) {
  const invoiceResult = await pgClient.query(
    'SELECT * FROM invoices WHERE razorpay_payment_link_id = $1 FOR UPDATE',
    [entity.payment_link_id]
  );
  const invoice = invoiceResult.rows[0];
  if (!invoice) return; // not one of ours — ack and ignore, same as the subscriptions branch's no-op

  await markInvoicePaid(pgClient, invoice, {
    method: 'razorpay',
    razorpay_payment_link_id: entity.payment_link_id,
    razorpay_payment_id: entity.payment_id,
  });

  const client = await pool.query('SELECT name, email FROM clients WHERE id = $1', [invoice.client_id]);
  if (client.rows[0]?.email) {
    sendMail({
      to: client.rows[0].email,
      subject: `Payment received — ${invoice.invoice_number}`,
      html: invoicePaymentReceived(client.rows[0].name, invoice.invoice_number, invoice.amount_paise),
    }).catch(() => {});
  }
}

module.exports = { nextInvoiceNumber, logInvoiceEvent, markInvoicePaid, handlePaymentLinkWebhook };
