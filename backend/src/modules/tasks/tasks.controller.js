const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const STATUSES = ['todo', 'in_progress', 'done'];

const listTasks = asyncHandler(async (req, res) => {
  if (!req.query.project_id) return fail(res, 'project_id is required', 400);
  const result = await pool.query(
    `SELECT t.*, a.name AS assignee_name FROM tasks t LEFT JOIN admins a ON a.id = t.assignee_id
     WHERE t.project_id = $1 ORDER BY t.sort_order ASC, t.id ASC`,
    [req.query.project_id]
  );
  ok(res, result.rows);
});

const createTask = asyncHandler(async (req, res) => {
  const { project_id, title, description, assignee_id, due_date } = req.body;
  if (!project_id) return fail(res, 'project_id is required', 400);
  if (!title || !title.trim()) return fail(res, 'Title is required', 400);

  const orderResult = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM tasks WHERE project_id = $1', [
    project_id,
  ]);

  const result = await pool.query(
    `INSERT INTO tasks (project_id, title, description, assignee_id, due_date, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [project_id, title.trim(), description || null, assignee_id || null, due_date || null, orderResult.rows[0].next]
  );
  await touchProject(result.rows[0].project_id);
  ok(res, result.rows[0], 201);
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, assignee_id, due_date } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) return fail(res, 'Invalid status', 400);

  const fields = [];
  const params = [];
  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };
  if (title !== undefined) set('title', title);
  if (description !== undefined) set('description', description);
  if (status !== undefined) set('status', status);
  if (assignee_id !== undefined) set('assignee_id', assignee_id);
  if (due_date !== undefined) set('due_date', due_date);
  if (!fields.length) return fail(res, 'Nothing to update', 400);
  fields.push('updated_at = NOW()');

  params.push(req.params.id);
  const result = await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return fail(res, 'Task not found', 404);
  // Activity on a task touches its parent project — same "child touches parent" shape as
  // ticket_messages bumping support_tickets.updated_at, kept as an explicit inline call rather
  // than a generic helper (each of this codebase's parent/child pairs wants a genuinely different
  // rule, a shared helper would just be a callback in a trenchcoat).
  await touchProject(result.rows[0].project_id);
  ok(res, result.rows[0]);
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING project_id', [req.params.id]);
  if (!result.rows[0]) return fail(res, 'Task not found', 404);
  await touchProject(result.rows[0].project_id);
  ok(res, { deleted: true });
});

const reorderTasks = asyncHandler(async (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  if (!Array.isArray(order)) return fail(res, 'order must be an array of { id, sort_order }', 400);

  await Promise.all(
    order.map(({ id, sort_order }) => pool.query('UPDATE tasks SET sort_order = $1 WHERE id = $2', [sort_order, id]))
  );
  ok(res, { updated: order.length });
});

async function touchProject(projectId) {
  await pool.query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
}

module.exports = { listTasks, createTask, updateTask, deleteTask, reorderTasks };
