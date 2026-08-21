const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { notifyAdmins } = require('../../utils/notifyAdmins');

const STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

const listAppointments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`a.status = $${params.length}`);
  }
  if (req.query.when === 'upcoming') {
    conditions.push(`a.scheduled_at >= NOW()`);
  } else if (req.query.when === 'past') {
    conditions.push(`a.scheduled_at < NOW()`);
  }
  if (req.query.client_id) {
    params.push(req.query.client_id);
    conditions.push(`a.client_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const order = req.query.when === 'past' ? 'a.scheduled_at DESC' : 'a.scheduled_at ASC';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM appointments a ${where}`, params);
  const dataResult = await pool.query(
    `SELECT a.*, c.name AS client_name, ad.name AS admin_name
     FROM appointments a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN admins ad ON ad.id = a.admin_id
     ${where} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const createAppointment = asyncHandler(async (req, res) => {
  const { lead_id, client_id, admin_id, title, scheduled_at, duration_minutes, notes } = req.body;
  if (!title || !title.trim()) return fail(res, 'Title is required', 400);
  if (!scheduled_at) return fail(res, 'scheduled_at is required', 400);

  const result = await pool.query(
    `INSERT INTO appointments (lead_id, client_id, admin_id, title, scheduled_at, duration_minutes, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [lead_id || null, client_id || null, admin_id || req.admin.id, title.trim(), scheduled_at, duration_minutes || 30, notes || null]
  );
  const appointment = result.rows[0];

  notifyAdmins('appointment_booked', {
    title: 'Appointment scheduled',
    body: `${appointment.title} — ${new Date(appointment.scheduled_at).toLocaleString('en-IN')}`,
    data: { appointment_id: appointment.id },
  }).catch((e) => console.error('[notifications] appointment_booked failed:', e.message));

  ok(res, appointment, 201);
});

const updateAppointment = asyncHandler(async (req, res) => {
  const { title, scheduled_at, duration_minutes, status, notes } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) return fail(res, 'Invalid status', 400);

  const fields = [];
  const params = [];
  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };
  if (title !== undefined) set('title', title);
  if (scheduled_at !== undefined) set('scheduled_at', scheduled_at);
  if (duration_minutes !== undefined) set('duration_minutes', duration_minutes);
  if (status !== undefined) set('status', status);
  if (notes !== undefined) set('notes', notes);
  if (!fields.length) return fail(res, 'Nothing to update', 400);

  params.push(req.params.id);
  const result = await pool.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return fail(res, 'Appointment not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { listAppointments, createAppointment, updateAppointment };
