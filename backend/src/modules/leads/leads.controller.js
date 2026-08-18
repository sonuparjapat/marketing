const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { leadAutoReply, leadAdminAlert } = require('../../utils/emailTemplates');
const { notifyAdmins } = require('../../utils/notifyAdmins');

const createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, company, service_interested, budget_range, message, source } = req.body;

  if (!name || !email) return fail(res, 'Name and email are required', 400);
  if (!validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);

  const result = await pool.query(
    `INSERT INTO leads (name, email, phone, company, service_interested, budget_range, message, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      validator.escape(name),
      email.trim().toLowerCase(),
      phone || null,
      company || null,
      service_interested || null,
      budget_range || null,
      message || null,
      source || 'contact-form',
    ]
  );

  const lead = result.rows[0];

  sendMail({ to: lead.email, subject: "We've received your message", html: leadAutoReply(lead.name) }).catch((e) =>
    console.error('Lead auto-reply email failed:', e.message)
  );
  if (process.env.ADMIN_EMAIL) {
    sendMail({ to: process.env.ADMIN_EMAIL, subject: `New lead: ${lead.name}`, html: leadAdminAlert(lead) }).catch(
      (e) => console.error('Lead admin alert email failed:', e.message)
    );
  }

  notifyAdmins('new_lead', {
    title: 'New lead',
    body: `${lead.name} — ${lead.service_interested || 'General enquiry'}`,
    data: lead,
  }).catch((e) => console.error('Lead notification failed:', e.message));

  ok(res, lead, 201);
});

// ── Admin ──────────────────────────────────────────────────
const listLeads = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`status = $${params.length}`);
  }
  if (req.query.service) {
    params.push(req.query.service);
    conditions.push(`service_interested = $${params.length}`);
  }
  if (req.query.from) {
    params.push(req.query.from);
    conditions.push(`created_at >= $${params.length}`);
  }
  if (req.query.to) {
    params.push(req.query.to);
    conditions.push(`created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM leads ${where}`, params);
  const dataResult = await pool.query(
    `SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const updateLead = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const fields = [];
  const params = [];

  if (status !== undefined) {
    params.push(status);
    fields.push(`status = $${params.length}`);
  }
  if (notes !== undefined) {
    params.push(notes);
    fields.push(`notes = $${params.length}`);
  }
  if (!fields.length) return fail(res, 'Nothing to update', 400);

  params.push(req.params.id);
  const result = await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return fail(res, 'Lead not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { createLead, listLeads, updateLead };
