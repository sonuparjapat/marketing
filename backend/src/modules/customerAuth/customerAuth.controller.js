const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function profileOf(customer) {
  return { id: customer.id, name: customer.name, email: customer.email, is_premium: customer.is_premium };
}

function issueSession(res, customer) {
  const token = jwt.sign(
    { id: customer.id, email: customer.email, name: customer.name, is_premium: customer.is_premium, type: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.cookie('customer_token', token, COOKIE_OPTS);
  return token;
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return fail(res, 'Name, email and password are required', 400);
  if (!validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);
  if (password.length < 8) return fail(res, 'Password must be at least 8 characters', 400);

  const hash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, is_premium`,
      [name.trim(), email.trim().toLowerCase(), hash]
    );
    const customer = result.rows[0];
    const token = issueSession(res, customer);
    ok(res, { token, customer: profileOf(customer) }, 201);
  } catch (err) {
    if (err.code === '23505') return fail(res, 'An account with that email already exists', 409);
    throw err;
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email.trim().toLowerCase()]);
  const customer = result.rows[0];
  if (!customer) return fail(res, 'Invalid credentials', 401);
  if (customer.is_active === false) return fail(res, 'This account has been deactivated', 403);

  const match = await bcrypt.compare(password, customer.password_hash);
  if (!match) return fail(res, 'Invalid credentials', 401);

  const token = issueSession(res, customer);
  ok(res, { token, customer: profileOf(customer) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('customer_token');
  ok(res, { loggedOut: true });
});

// Fresh DB lookup on every call, same reasoning as admin.controller.js's /me — a deactivated
// account or an is_premium change takes effect on next app load, not just next login.
const me = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
  const customer = result.rows[0];
  if (!customer || customer.is_active === false) return fail(res, 'This account is no longer active', 401);
  ok(res, profileOf(customer));
});

module.exports = { register, login, logout, me };
