const bcrypt = require('bcryptjs');
const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const listAdmins = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, is_active, last_login, created_at FROM admins ORDER BY created_at ASC'
  );
  ok(res, { items: result.rows, page: 1, limit: result.rows.length, total: result.rows.length });
});

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return fail(res, 'Name, email and password are required', 400);
  if (!validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);
  if (password.length < 8) return fail(res, 'Password must be at least 8 characters', 400);

  const hash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email.trim().toLowerCase(), hash, role === 'super_admin' ? 'super_admin' : 'editor']
    );
    ok(res, result.rows[0], 201);
  } catch (err) {
    if (err.code === '23505') return fail(res, 'An admin with that email already exists', 409);
    throw err;
  }
});

const setActive = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') return fail(res, 'is_active (boolean) is required', 400);
  if (Number(req.params.id) === req.admin.id) return fail(res, "You can't deactivate your own account", 400);

  const result = await pool.query(
    'UPDATE admins SET is_active = $1 WHERE id = $2 RETURNING id, name, email, role, is_active',
    [is_active, req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Admin not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { listAdmins, createAdmin, setActive };
