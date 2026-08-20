const bcrypt = require('bcryptjs');
const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const SELECT_FIELDS = `
  admins.id, admins.name, admins.email, admins.role, admins.is_active,
  admins.last_login, admins.created_at, admins.department_id, departments.name AS department_name
`;

const listAdmins = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT ${SELECT_FIELDS} FROM admins
    LEFT JOIN departments ON departments.id = admins.department_id
    ORDER BY admins.created_at ASC
  `);
  ok(res, { items: result.rows, page: 1, limit: result.rows.length, total: result.rows.length });
});

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role, department_id } = req.body;
  if (!name || !email || !password) return fail(res, 'Name, email and password are required', 400);
  if (!validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);
  if (password.length < 8) return fail(res, 'Password must be at least 8 characters', 400);

  const finalRole = role === 'super_admin' ? 'super_admin' : 'editor';
  const hash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO admins (name, email, password_hash, role, department_id) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, is_active, department_id, created_at`,
      [name, email.trim().toLowerCase(), hash, finalRole, finalRole === 'super_admin' ? null : department_id || null]
    );
    ok(res, result.rows[0], 201);
  } catch (err) {
    if (err.code === '23505') return fail(res, 'An admin with that email already exists', 409);
    throw err;
  }
});

const updateAdmin = asyncHandler(async (req, res) => {
  const { name, role, department_id, is_active } = req.body;
  const isSelf = Number(req.params.id) === req.admin.id;
  if (isSelf && is_active === false) return fail(res, "You can't deactivate your own account", 400);

  const fields = [];
  const values = [];
  if (name !== undefined) {
    values.push(name);
    fields.push(`name = $${values.length}`);
  }
  if (role !== undefined) {
    const finalRole = role === 'super_admin' ? 'super_admin' : 'editor';
    values.push(finalRole);
    fields.push(`role = $${values.length}`);
    if (finalRole === 'super_admin') fields.push('department_id = NULL');
  }
  if (department_id !== undefined && role !== 'super_admin') {
    // Harmless even if this admin's existing (unchanged) role happens to be super_admin —
    // department_id is simply ignored for super_admin accounts everywhere it's read.
    values.push(department_id || null);
    fields.push(`department_id = $${values.length}`);
  }
  if (is_active !== undefined) {
    values.push(is_active);
    fields.push(`is_active = $${values.length}`);
  }
  if (!fields.length) return fail(res, 'Nothing to update', 400);

  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE admins SET ${fields.join(', ')} WHERE id = $${values.length}
     RETURNING id, name, email, role, is_active, department_id`,
    values
  );
  if (!result.rows[0]) return fail(res, 'Admin not found', 404);
  ok(res, result.rows[0]);
});

// Super Admin resetting another admin's password (or their own) — no current-password check,
// since this route is already gated to super_admin only. Self-service password changes (any
// admin changing their own, with current-password verification) live in admin.controller.js.
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return fail(res, 'Password must be at least 8 characters', 400);

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    'UPDATE admins SET password_hash = $1, token_version = token_version + 1 WHERE id = $2 RETURNING id',
    [hash, req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Admin not found', 404);
  ok(res, { id: result.rows[0].id });
});

module.exports = { listAdmins, createAdmin, updateAdmin, resetPassword };
