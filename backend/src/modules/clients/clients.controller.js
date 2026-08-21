const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const STATUSES = ['active', 'paused', 'archived', 'churned'];

const listClients = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`);
  }
  if (req.query.status) {
    params.push(req.query.status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM clients ${where}`, params);
  const dataResult = await pool.query(
    `SELECT c.*, a.name AS account_manager_name
     FROM clients c LEFT JOIN admins a ON a.id = c.account_manager_id
     ${where} ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const getClient = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, a.name AS account_manager_name
     FROM clients c LEFT JOIN admins a ON a.id = c.account_manager_id
     WHERE c.id = $1`,
    [req.params.id]
  );
  const clientRow = result.rows[0];
  if (!clientRow) return fail(res, 'Client not found', 404);
  ok(res, clientRow);
});

const createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, company, industry, account_manager_id, notes } = req.body;
  if (!name || !name.trim()) return fail(res, 'Name is required', 400);

  const result = await pool.query(
    `INSERT INTO clients (name, email, phone, company, industry, account_manager_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name.trim(), email || null, phone || null, company || null, industry || null, account_manager_id || null, notes || null]
  );
  ok(res, result.rows[0], 201);
});

const updateClient = asyncHandler(async (req, res) => {
  const { name, email, phone, company, industry, status, account_manager_id, notes } = req.body;
  if (status !== undefined && !STATUSES.includes(status)) return fail(res, 'Invalid status', 400);

  const fields = [];
  const params = [];
  const set = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };
  if (name !== undefined) set('name', name);
  if (email !== undefined) set('email', email);
  if (phone !== undefined) set('phone', phone);
  if (company !== undefined) set('company', company);
  if (industry !== undefined) set('industry', industry);
  if (status !== undefined) set('status', status);
  if (account_manager_id !== undefined) set('account_manager_id', account_manager_id);
  if (notes !== undefined) set('notes', notes);
  if (!fields.length) return fail(res, 'Nothing to update', 400);
  fields.push('updated_at = NOW()');

  params.push(req.params.id);
  const result = await pool.query(`UPDATE clients SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  if (!result.rows[0]) return fail(res, 'Client not found', 404);
  ok(res, result.rows[0]);
});

// Hard delete only ever succeeds on an empty client — no projects, no invoices. Both are financial/
// work-history records that must outlive being able to delete their client; archiving (status)
// is the normal "remove" UX, this is only an escape hatch for an empty/mistaken client.
const deleteClient = asyncHandler(async (req, res) => {
  const inUseProjects = await pool.query('SELECT 1 FROM projects WHERE client_id = $1 LIMIT 1', [req.params.id]);
  if (inUseProjects.rows.length > 0) {
    return fail(res, 'This client has projects on record — archive it instead of deleting, or remove its projects first', 400);
  }
  const inUseInvoices = await pool.query('SELECT 1 FROM invoices WHERE client_id = $1 LIMIT 1', [req.params.id]);
  if (inUseInvoices.rows.length > 0) {
    return fail(res, 'This client has invoices on record and cannot be deleted — archive it instead', 400);
  }

  const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return fail(res, 'Client not found', 404);
  ok(res, { deleted: true });
});

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
