const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { customerPasswordReset } = require('../../utils/emailTemplates');

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
    {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      is_premium: customer.is_premium,
      type: 'customer',
      tv: customer.token_version || 1,
    },
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

// Always responds the same way whether or not the email exists, so the endpoint can't be used to
// enumerate registered accounts.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);

  const result = await pool.query('SELECT id, name, email FROM customers WHERE email = $1', [email.trim().toLowerCase()]);
  const customer = result.rows[0];

  if (customer) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query('UPDATE customers SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3', [
      token,
      expires,
      customer.id,
    ]);
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    sendMail({ to: customer.email, subject: 'Reset your password', html: customerPasswordReset(customer.name, resetUrl) }).catch(
      (e) => console.error('[mailer] password reset email failed:', e.message)
    );
  }

  ok(res, { message: 'If an account exists for that email, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return fail(res, 'Token and new password are required', 400);
  if (password.length < 8) return fail(res, 'Password must be at least 8 characters', 400);

  const result = await pool.query(
    'SELECT id FROM customers WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
    [token]
  );
  const customer = result.rows[0];
  if (!customer) return fail(res, 'This reset link is invalid or has expired', 400);

  const hash = await bcrypt.hash(password, 12);
  // Bumping token_version signs out every device that was logged in before the reset — the
  // whole point of a "forgot password" flow is that a previous session may not be trustworthy.
  await pool.query(
    `UPDATE customers
     SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, token_version = token_version + 1
     WHERE id = $2`,
    [hash, customer.id]
  );
  ok(res, { message: 'Password updated — you can now sign in.' });
});

// Self-service data export (a plain-English "right to access" — returns everything the platform
// holds about this customer as one JSON document, not a formatted report).
const exportData = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, is_premium, created_at FROM customers WHERE id = $1',
    [req.customer.id]
  );
  const customer = result.rows[0];
  if (!customer) return fail(res, 'Account not found', 404);
  ok(res, { account: customer, exported_at: new Date().toISOString() });
});

// Self-service account deletion — permanent, no confirmation email step (the customer is already
// authenticated when they call this). The row is gone, so there's nothing left to token_version-bump;
// the next request with this token 404s the account lookup in customerAuth and is rejected there.
const deleteAccount = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM customers WHERE id = $1', [req.customer.id]);
  res.clearCookie('customer_token');
  ok(res, { deleted: true });
});

module.exports = { register, login, logout, me, forgotPassword, resetPassword, exportData, deleteAccount };
