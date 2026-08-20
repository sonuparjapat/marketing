const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { ticketAdminAlert, ticketReplyNotification } = require('../../utils/emailTemplates');
const { notifyAdmins } = require('../../utils/notifyAdmins');

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// ── Customer-facing ──────────────────────────────────────────

const createTicket = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !subject.trim()) return fail(res, 'Subject is required', 400);
  if (!message || !message.trim()) return fail(res, 'Message is required', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ticketResult = await client.query(
      'INSERT INTO support_tickets (customer_id, subject) VALUES ($1, $2) RETURNING *',
      [req.customer.id, subject.trim().slice(0, 200)]
    );
    const ticket = ticketResult.rows[0];
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message) VALUES ($1, 'customer', $2, $3)`,
      [ticket.id, req.customer.id, message.trim()]
    );
    await client.query('COMMIT');

    if (process.env.ADMIN_EMAIL) {
      sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `New support ticket: ${ticket.subject}`,
        html: ticketAdminAlert(ticket, req.customer),
      }).catch((e) => console.error('Ticket admin alert email failed:', e.message));
    }
    notifyAdmins('new_ticket', {
      title: 'New support ticket',
      body: `${req.customer.name} — ${ticket.subject}`,
      data: ticket,
    }).catch((e) => console.error('Ticket notification failed:', e.message));

    ok(res, ticket, 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const listMyTickets = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM support_tickets WHERE customer_id = $1 ORDER BY updated_at DESC',
    [req.customer.id]
  );
  ok(res, result.rows);
});

const getMyTicket = asyncHandler(async (req, res) => {
  const ticket = await pool.query('SELECT * FROM support_tickets WHERE id = $1 AND customer_id = $2', [
    req.params.id,
    req.customer.id,
  ]);
  if (!ticket.rows[0]) return fail(res, 'Ticket not found', 404);

  const messages = await pool.query('SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [
    req.params.id,
  ]);
  ok(res, { ...ticket.rows[0], messages: messages.rows });
});

const replyToMyTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return fail(res, 'Message is required', 400);

  const ticket = await pool.query('SELECT * FROM support_tickets WHERE id = $1 AND customer_id = $2', [
    req.params.id,
    req.customer.id,
  ]);
  if (!ticket.rows[0]) return fail(res, 'Ticket not found', 404);
  if (ticket.rows[0].status === 'closed') return fail(res, 'This ticket is closed', 400);

  const result = await pool.query(
    `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message) VALUES ($1, 'customer', $2, $3) RETURNING *`,
    [req.params.id, req.customer.id, message.trim()]
  );
  await pool.query("UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = $1", [req.params.id]);

  notifyAdmins('new_ticket_message', {
    title: 'New ticket reply',
    body: `${req.customer.name} replied to "${ticket.rows[0].subject}"`,
    data: { ticket_id: Number(req.params.id) },
  }).catch((e) => console.error('Ticket notification failed:', e.message));

  ok(res, result.rows[0], 201);
});

// ── Admin ─────────────────────────────────────────────────────

const adminListTickets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`support_tickets.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM support_tickets ${where}`, params);
  const dataResult = await pool.query(
    `SELECT support_tickets.*, customers.name AS customer_name, customers.email AS customer_email
     FROM support_tickets JOIN customers ON customers.id = support_tickets.customer_id
     ${where} ORDER BY support_tickets.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const adminGetTicket = asyncHandler(async (req, res) => {
  const ticket = await pool.query(
    `SELECT support_tickets.*, customers.name AS customer_name, customers.email AS customer_email
     FROM support_tickets JOIN customers ON customers.id = support_tickets.customer_id
     WHERE support_tickets.id = $1`,
    [req.params.id]
  );
  if (!ticket.rows[0]) return fail(res, 'Ticket not found', 404);

  const messages = await pool.query('SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC', [
    req.params.id,
  ]);
  ok(res, { ...ticket.rows[0], messages: messages.rows });
});

const adminReplyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return fail(res, 'Message is required', 400);

  const ticket = await pool.query(
    `SELECT support_tickets.*, customers.name AS customer_name, customers.email AS customer_email
     FROM support_tickets JOIN customers ON customers.id = support_tickets.customer_id
     WHERE support_tickets.id = $1`,
    [req.params.id]
  );
  if (!ticket.rows[0]) return fail(res, 'Ticket not found', 404);

  const result = await pool.query(
    `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message) VALUES ($1, 'admin', $2, $3) RETURNING *`,
    [req.params.id, req.admin.id, message.trim()]
  );
  await pool.query("UPDATE support_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1", [
    req.params.id,
  ]);

  const siteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  sendMail({
    to: ticket.rows[0].customer_email,
    subject: `New reply: ${ticket.rows[0].subject}`,
    html: ticketReplyNotification(ticket.rows[0].customer_name, ticket.rows[0].subject, `${siteUrl}/account/support/${req.params.id}`),
  }).catch((e) => console.error('Ticket reply email failed:', e.message));

  ok(res, result.rows[0], 201);
});

const adminUpdateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return fail(res, `Status must be one of: ${STATUSES.join(', ')}`, 400);

  const result = await pool.query(
    'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Ticket not found', 404);
  ok(res, result.rows[0]);
});

module.exports = {
  createTicket,
  listMyTickets,
  getMyTicket,
  replyToMyTicket,
  adminListTickets,
  adminGetTicket,
  adminReplyToTicket,
  adminUpdateTicketStatus,
};
