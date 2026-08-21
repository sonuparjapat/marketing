const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otplib = require('otplib');
const QRCode = require('qrcode');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { hasImageSignature, storeFile } = require('../../utils/fileUpload');

// Resolves a raw `admins` row into the full profile shape returned by both login and /me —
// department name + flattened "resource.action" permission strings. Super admins and admins with
// no department get an empty permissions array (super_admin bypasses checkPermission entirely, so
// its permissions array is never actually consulted).
async function resolveAdminProfile(admin) {
  let permissions = [];
  let departmentName = null;

  if (admin.role !== 'super_admin' && admin.department_id) {
    const permResult = await pool.query(
      `SELECT permissions.resource_key, department_permissions.can_create, department_permissions.can_read,
              department_permissions.can_update, department_permissions.can_delete
       FROM department_permissions
       JOIN permissions ON permissions.id = department_permissions.permission_id
       WHERE department_permissions.department_id = $1`,
      [admin.department_id]
    );
    // Flatten each resource's CRUD flags into "resource.action" strings — checkPermission() and
    // the frontend's hasPermission() both just check this array for a matching string, so the
    // resource+flags storage shape stays an implementation detail behind the JWT boundary.
    permissions = permResult.rows.flatMap((r) => {
      const grants = [];
      if (r.can_create) grants.push(`${r.resource_key}.create`);
      if (r.can_read) grants.push(`${r.resource_key}.read`);
      if (r.can_update) grants.push(`${r.resource_key}.update`);
      if (r.can_delete) grants.push(`${r.resource_key}.delete`);
      return grants;
    });
    const deptResult = await pool.query('SELECT name FROM departments WHERE id = $1', [admin.department_id]);
    departmentName = deptResult.rows[0]?.name || null;
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    department_id: admin.department_id,
    department_name: departmentName,
    permissions,
    totp_enabled: admin.totp_enabled || false,
  };
}

// Shared by both a normal password-only login and the second step of a 2FA login — issues the
// real session (JWT + cookie + last_login) once the admin is fully verified.
async function issueFullSession(res, admin) {
  const profile = await resolveAdminProfile(admin);

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      department_id: admin.department_id,
      permissions: profile.permissions,
      tv: admin.token_version || 1,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { token, admin: profile };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email.trim().toLowerCase()]);
  const admin = result.rows[0];
  if (!admin) return fail(res, 'Invalid credentials', 401);
  if (admin.is_active === false) return fail(res, 'This account has been deactivated', 403);

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) return fail(res, 'Invalid credentials', 401);

  // Password verified but 2FA is on — don't issue a real session yet, just a short-lived token
  // proving the password step passed, which the second step exchanges for the real one.
  if (admin.totp_enabled) {
    const pendingToken = jwt.sign({ id: admin.id, type: 'admin_2fa_pending' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    return ok(res, { requires2fa: true, pendingToken });
  }

  ok(res, await issueFullSession(res, admin));
});

// Second step of a 2FA login — exchanges the 5-minute pending token + a live authenticator code
// for the real session, identically to what a non-2FA login issues.
const verifyLoginTwoFactor = asyncHandler(async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code) return fail(res, 'Code is required', 400);

  let decoded;
  try {
    decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
  } catch {
    return fail(res, 'That login attempt has expired — please sign in again', 401);
  }
  if (decoded.type !== 'admin_2fa_pending') return fail(res, 'Invalid login attempt', 401);

  const result = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
  const admin = result.rows[0];
  if (!admin || admin.is_active === false || !admin.totp_enabled) return fail(res, 'Invalid login attempt', 401);

  const valid = await otplib.verify({ secret: admin.totp_secret, token: String(code).trim() });
  if (!valid.valid) return fail(res, 'Incorrect code', 401);

  ok(res, await issueFullSession(res, admin));
});

// Step 1 of enabling 2FA — generates a new secret (stored but NOT yet active: totp_enabled stays
// false until verifyTwoFactor confirms the admin actually scanned it and can produce live codes).
const setupTwoFactor = asyncHandler(async (req, res) => {
  const secret = otplib.generateSecret();
  await pool.query('UPDATE admins SET totp_secret = $1, totp_enabled = FALSE WHERE id = $2', [secret, req.admin.id]);

  const uri = otplib.generateURI({
    issuer: process.env.APP_NAME || 'Anvil Digital Admin',
    label: req.admin.email,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(uri);
  ok(res, { secret, qrCodeDataUrl });
});

// Step 2 — confirms the admin's authenticator app is actually producing valid codes before 2FA
// is switched on, so a botched setup can't lock the admin out of their own account.
const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return fail(res, 'Code is required', 400);

  const result = await pool.query('SELECT totp_secret FROM admins WHERE id = $1', [req.admin.id]);
  const secret = result.rows[0]?.totp_secret;
  if (!secret) return fail(res, 'Start 2FA setup first', 400);

  const valid = await otplib.verify({ secret, token: String(code).trim() });
  if (!valid.valid) return fail(res, 'Incorrect code', 401);

  await pool.query('UPDATE admins SET totp_enabled = TRUE WHERE id = $1', [req.admin.id]);
  ok(res, { enabled: true });
});

// Requires the current password (not a live code — the admin may have lost their authenticator,
// which is exactly the case this needs to cover) so a hijacked session alone can't turn 2FA off.
const disableTwoFactor = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return fail(res, 'Current password is required', 400);

  const result = await pool.query('SELECT password_hash FROM admins WHERE id = $1', [req.admin.id]);
  const match = result.rows[0] && (await bcrypt.compare(password, result.rows[0].password_hash));
  if (!match) return fail(res, 'Incorrect password', 401);

  await pool.query('UPDATE admins SET totp_enabled = FALSE, totp_secret = NULL WHERE id = $1', [req.admin.id]);
  ok(res, { enabled: false });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  ok(res, { loggedOut: true });
});

// The "verify" endpoint — called on every app mount/refresh (see AdminAuthContext.tsx), not just
// at login. Deliberately re-reads the admin + their department's current permissions from the
// database on every call, rather than trusting the (up to 7-day-old) JWT claims. This closes two
// gaps the JWT-embedded approach has: a deactivated account stays rejected immediately instead of
// only at next login, and a department's permission changes take effect on the admin's next page
// refresh instead of only their next login. checkPermission() on other routes still reads the JWT
// directly (no DB hit per request, for performance) — only this endpoint pays the freshness cost,
// since it's called rarely.
const me = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
  const admin = result.rows[0];
  if (!admin || admin.is_active === false) return fail(res, 'This account is no longer active', 401);

  const profile = await resolveAdminProfile(admin);
  ok(res, profile);
});

const stats = asyncHandler(async (req, res) => {
  // The dashboard is reachable by every admin, but lead records carry PII (name/email) — only
  // include them for admins who actually hold leads.view, rather than gating the whole endpoint.
  const canViewLeads = req.admin.role === 'super_admin' || (req.admin.permissions || []).includes('leads.read');

  const [subscribers, postViews, pendingCallbacks] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM subscribers WHERE is_active = TRUE'),
    pool.query("SELECT COALESCE(SUM(views),0)::int AS total FROM posts WHERE created_at >= date_trunc('month', CURRENT_DATE)"),
    pool.query("SELECT COUNT(*)::int AS count FROM callbacks WHERE status = 'pending'"),
  ]);

  let leadsToday = null;
  let leadsTotal = null;
  let recentLeads = [];
  if (canViewLeads) {
    const [today, total, recent] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM leads WHERE created_at >= CURRENT_DATE"),
      pool.query('SELECT COUNT(*)::int AS count FROM leads'),
      pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5'),
    ]);
    leadsToday = today.rows[0].count;
    leadsTotal = total.rows[0].count;
    recentLeads = recent.rows;
  }

  ok(res, {
    leadsToday,
    leadsTotal,
    activeSubscribers: subscribers.rows[0].count,
    blogViewsThisMonth: postViews.rows[0].total,
    pendingCallbacks: pendingCallbacks.rows[0].count,
    recentLeads,
  });
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400);
  if (!hasImageSignature(req.file.buffer)) return fail(res, 'That file does not look like a valid image', 400);

  const { url } = await storeFile({
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    req,
  });

  const result = await pool.query(
    `INSERT INTO media (url, filename, mime_type, size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [url, req.file.originalname, req.file.mimetype, req.file.size, req.admin?.id || null]
  );

  ok(res, { url, media: result.rows[0] }, 201);
});

// Self-service — any authenticated admin changing their own password, verified against their
// current one. Distinct from admins.controller.js's resetPassword, which is Super Admin resetting
// someone else's password with no current-password check.
const changeOwnPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return fail(res, 'Current and new password are required', 400);
  if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters', 400);

  const result = await pool.query('SELECT password_hash FROM admins WHERE id = $1', [req.admin.id]);
  const admin = result.rows[0];
  if (!admin) return fail(res, 'Admin not found', 404);

  const match = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!match) return fail(res, 'Current password is incorrect', 401);

  const hash = await bcrypt.hash(newPassword, 12);
  // Bumping token_version signs every other active session (other tabs/devices) out immediately —
  // including this request's own token, by design: a password change should require a fresh login,
  // the same as changing your password on a bank site does.
  await pool.query(
    'UPDATE admins SET password_hash = $1, token_version = token_version + 1 WHERE id = $2',
    [hash, req.admin.id]
  );
  ok(res, { updated: true });
});

module.exports = {
  login,
  verifyLoginTwoFactor,
  logout,
  me,
  stats,
  uploadImage,
  changeOwnPassword,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
};
