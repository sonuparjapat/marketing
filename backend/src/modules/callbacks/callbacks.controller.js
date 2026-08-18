const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { callbackConfirmation, callbackAdminAlert } = require('../../utils/emailTemplates');
const { notifyAdmins } = require('../../utils/notifyAdmins');

const requestCallback = asyncHandler(async (req, res) => {
  const { name, phone, preferred_time } = req.body;
  if (!name || !phone) return fail(res, 'Name and phone are required', 400);

  const result = await pool.query(
    `INSERT INTO callbacks (name, phone, preferred_time) VALUES ($1,$2,$3) RETURNING *`,
    [name, phone, preferred_time || null]
  );
  const cb = result.rows[0];

  if (process.env.ADMIN_EMAIL) {
    sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `New callback request: ${cb.name}`,
      html: callbackAdminAlert(cb),
    }).catch((e) => console.error('Callback admin alert failed:', e.message));
  }

  notifyAdmins('new_callback', {
    title: 'New callback request',
    body: `${cb.name} — ${cb.phone}`,
    data: cb,
  }).catch((e) => console.error('Callback notification failed:', e.message));

  ok(res, cb, 201);
});

const listCallbacks = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM callbacks');
  const dataResult = await pool.query(
    'SELECT * FROM callbacks ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const updateCallback = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) return fail(res, 'Status is required', 400);
  const result = await pool.query('UPDATE callbacks SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  if (!result.rows[0]) return fail(res, 'Callback not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { requestCallback, listCallbacks, updateCallback };
