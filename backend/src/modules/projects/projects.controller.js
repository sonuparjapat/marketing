const fs = require('fs');
const path = require('path');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

// Filtered by client_id when viewing from a Client's detail page — the generic buildAdminCrud
// factory has no filter support, hence the custom controller (same reasoning documented for
// Clients/Projects/Tasks in the plan this was built from).
const listProjects = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.client_id) {
    params.push(req.query.client_id);
    conditions.push(`p.client_id = $${params.length}`);
  }
  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`p.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM projects p ${where}`, params);
  const dataResult = await pool.query(
    `SELECT p.*, c.name AS client_name
     FROM projects p JOIN clients c ON c.id = p.client_id
     ${where} ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const getProject = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, c.name AS client_name FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.id = $1`,
    [req.params.id]
  );
  const project = result.rows[0];
  if (!project) return fail(res, 'Project not found', 404);

  const tasks = await pool.query(
    `SELECT t.*, a.name AS assignee_name FROM tasks t LEFT JOIN admins a ON a.id = t.assignee_id
     WHERE t.project_id = $1 ORDER BY t.sort_order ASC, t.id ASC`,
    [req.params.id]
  );

  ok(res, { ...project, tasks: tasks.rows });
});

const createProject = asyncHandler(async (req, res) => {
  const { client_id, name, description, status, start_date, end_date, budget_paise } = req.body;
  if (!client_id) return fail(res, 'client_id is required', 400);
  if (!name || !name.trim()) return fail(res, 'Name is required', 400);
  if (status !== undefined && !STATUSES.includes(status)) return fail(res, 'Invalid status', 400);

  const result = await pool.query(
    `INSERT INTO projects (client_id, name, description, status, start_date, end_date, budget_paise)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [client_id, name.trim(), description || null, status || 'planning', start_date || null, end_date || null, budget_paise || null]
  );
  ok(res, result.rows[0], 201);
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, start_date, end_date, budget_paise } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) return fail(res, 'Invalid status', 400);

  const fields = [];
  const params = [];
  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };
  if (name !== undefined) set('name', name);
  if (description !== undefined) set('description', description);
  if (status !== undefined) set('status', status);
  if (start_date !== undefined) set('start_date', start_date);
  if (end_date !== undefined) set('end_date', end_date);
  if (budget_paise !== undefined) set('budget_paise', budget_paise);
  if (!fields.length) return fail(res, 'Nothing to update', 400);
  fields.push('updated_at = NOW()');

  params.push(req.params.id);
  const result = await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return fail(res, 'Project not found', 404);
  ok(res, result.rows[0]);
});

// tasks CASCADE automatically; documents do not (entity_id is polymorphic, so it can't be a real
// FK Postgres could cascade) — cleaned up explicitly here, mirroring media.controller.js's
// removeMedia best-effort-unlink pattern for the local-disk case.
const deleteProject = asyncHandler(async (req, res) => {
  const docs = await pool.query(`DELETE FROM documents WHERE entity_type = 'project' AND entity_id = $1 RETURNING url`, [
    req.params.id,
  ]);
  for (const doc of docs.rows) {
    if (doc.url && doc.url.includes('/uploads/')) {
      fs.unlink(path.join(UPLOADS_DIR, doc.url.split('/uploads/').pop()), () => {});
    }
  }

  const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return fail(res, 'Project not found', 404);
  ok(res, { deleted: true });
});

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };
