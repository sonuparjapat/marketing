const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { sendMail } = require('../../config/mailer');
const { customerPasswordReset, customerVerification } = require('../../utils/emailTemplates');
const { IS_PREMIUM_SQL } = require('../../utils/entitlements');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function profileOf(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    is_premium: customer.is_premium,
    created_at: customer.created_at,
  };
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
  const token = crypto.randomBytes(32).toString('hex');
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, password_hash, is_verified, verification_token)
       VALUES ($1, $2, $3, FALSE, $4)
       RETURNING id, name, email`,
      [name.trim(), email.trim().toLowerCase(), hash, token]
    );
    const customer = result.rows[0];
    // Registering does NOT log the customer in — only a verified account can hold a session
    // (see login()'s block below). The frontend shows a "check your inbox" state instead.
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    sendMail({ to: customer.email, subject: 'Verify your email', html: customerVerification(customer.name, verifyUrl) }).catch(
      (e) => console.error('[mailer] verification email failed:', e.message)
    );
    ok(res, { verificationSent: true, email: customer.email }, 201);
  } catch (err) {
    if (err.code === '23505') return fail(res, 'An account with that email already exists', 409);
    throw err;
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const result = await pool.query(
    `SELECT id, name, email, password_hash, is_active, is_verified, token_version, created_at, ${IS_PREMIUM_SQL} AS is_premium
     FROM customers WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  const customer = result.rows[0];
  if (!customer) return fail(res, 'Invalid credentials', 401);
  if (customer.is_active === false) return fail(res, 'This account has been deactivated', 403);
  if (!customer.is_verified) return fail(res, 'Please verify your email before logging in', 403);

  const match = await bcrypt.compare(password, customer.password_hash);
  if (!match) return fail(res, 'Invalid credentials', 401);

  await pool.query('UPDATE customers SET last_login = NOW() WHERE id = $1', [customer.id]);

  const token = issueSession(res, customer);
  ok(res, { token, customer: profileOf(customer) });
});

// POST /auth/verify-email { token } — no session is issued on success (matches register: the
// customer signs in separately afterwards). No expiry on the token, mirroring ayurvedaeccom.
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return fail(res, 'Verification token is required', 400);

  const result = await pool.query(
    `UPDATE customers SET is_verified = TRUE, email_verified_at = NOW(), verification_token = NULL
     WHERE verification_token = $1 AND is_verified = FALSE
     RETURNING id`,
    [token]
  );
  if (result.rows.length === 0) return fail(res, 'This verification link is invalid or has already been used', 400);
  ok(res, { verified: true });
});

// POST /auth/resend-verification { email } — same no-enumeration response shape as forgotPassword,
// and a no-op (still "success") if the account is already verified so this can't be used to probe
// verification state either.
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) return fail(res, 'Please provide a valid email', 400);

  const result = await pool.query('SELECT id, name, email, is_verified FROM customers WHERE email = $1', [
    email.trim().toLowerCase(),
  ]);
  const customer = result.rows[0];

  if (customer && !customer.is_verified) {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('UPDATE customers SET verification_token = $1 WHERE id = $2', [token, customer.id]);
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    sendMail({ to: customer.email, subject: 'Verify your email', html: customerVerification(customer.name, verifyUrl) }).catch(
      (e) => console.error('[mailer] verification email failed:', e.message)
    );
  }

  ok(res, { message: 'If an account exists for that email and needs verification, a new link has been sent.' });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('customer_token');
  ok(res, { loggedOut: true });
});

// Fresh DB lookup on every call, same reasoning as admin.controller.js's /me — a deactivated
// account or an is_premium change takes effect on next app load, not just next login.
const me = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, is_active, created_at, ${IS_PREMIUM_SQL} AS is_premium FROM customers WHERE id = $1`,
    [req.customer.id]
  );
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

// Self-service profile edit — name only for now (email change would need re-verification, out of
// scope until there's an actual verification-email flow to hang it off of).
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return fail(res, 'Name cannot be empty', 400);

  const result = await pool.query(
    `UPDATE customers SET name = $1 WHERE id = $2
     RETURNING id, name, email, is_active, created_at, ${IS_PREMIUM_SQL} AS is_premium`,
    [name.trim().slice(0, 150), req.customer.id]
  );
  ok(res, profileOf(result.rows[0]));
});

// Powers the profile page's engagement stats (comments/reviews/tickets posted) — three cheap
// indexed counts, not worth a heavier aggregate endpoint.
const getStats = asyncHandler(async (req, res) => {
  const [comments, reviews, tickets] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM comments WHERE customer_id = $1', [req.customer.id]),
    pool.query('SELECT COUNT(*)::int AS count FROM testimonials WHERE customer_id = $1', [req.customer.id]),
    pool.query('SELECT COUNT(*)::int AS count FROM support_tickets WHERE customer_id = $1', [req.customer.id]),
  ]);
  ok(res, {
    comment_count: comments.rows[0].count,
    review_count: reviews.rows[0].count,
    ticket_count: tickets.rows[0].count,
  });
});

// Self-service data export (a plain-English "right to access" — returns everything the platform
// holds about this customer as one JSON document, not a formatted report).
const exportData = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, created_at, ${IS_PREMIUM_SQL} AS is_premium FROM customers WHERE id = $1`,
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

module.exports = {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  updateProfile,
  getStats,
  forgotPassword,
  resetPassword,
  exportData,
  deleteAccount,
};
