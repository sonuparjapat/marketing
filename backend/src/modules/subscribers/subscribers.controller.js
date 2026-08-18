const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { subscriberWelcome } = require('../../utils/emailTemplates');

const subscribe = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  if (!email || !validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);

  const result = await pool.query(
    `INSERT INTO subscribers (email, name) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET is_active = TRUE
     RETURNING *`,
    [email.trim().toLowerCase(), name || null]
  );

  sendMail({ to: email, subject: "You're subscribed!", html: subscriberWelcome() }).catch((e) =>
    console.error('Subscriber welcome email failed:', e.message)
  );

  ok(res, result.rows[0], 201);
});

const listSubscribers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM subscribers');
  const dataResult = await pool.query(
    'SELECT * FROM subscribers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const exportSubscribersCsv = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT email, name, is_active, created_at FROM subscribers ORDER BY created_at DESC');
  const header = 'email,name,is_active,created_at\n';
  const rows = result.rows
    .map((r) => [r.email, r.name || '', r.is_active, r.created_at.toISOString()].join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
  res.send(header + rows);
});

module.exports = { subscribe, listSubscribers, exportSubscribersCsv };
