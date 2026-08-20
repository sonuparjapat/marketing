const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { fail } = require('../utils/response');

function extractToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Verifies the JWT AND checks token_version against the DB on every request. A pure JWT-verify
// can't be revoked before it expires (up to 7 days); this closes that gap — deactivating an admin
// or changing a password bumps token_version, which instantly invalidates every already-issued
// token for that account, not just the one used to make the change. One extra indexed PK lookup
// per request is the accepted cost for real revocation without standing up Redis.
async function adminAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return fail(res, 'Authentication required', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT token_version, is_active FROM admins WHERE id = $1', [decoded.id]);
    const admin = result.rows[0];
    if (!admin || admin.is_active === false) return fail(res, 'Invalid or expired token', 401);
    if ((decoded.tv || 1) !== admin.token_version) return fail(res, 'Your session has expired — please sign in again', 401);
    req.admin = decoded;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}

// Only super_admin manages other admins, departments, and site-wide settings/appearance —
// this is intentionally not delegable via department permissions.
function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super_admin') return fail(res, 'Only a super admin can do this', 403);
  next();
}

// Granular per-action permission check. Super Admin always passes. Editors pass only if
// their department was granted this exact key at login time (permissions are embedded in
// the JWT, not re-queried per request — see admin.controller.js's login()).
function checkPermission(key) {
  return (req, res, next) => {
    if (req.admin?.role === 'super_admin') return next();
    if (Array.isArray(req.admin?.permissions) && req.admin.permissions.includes(key)) return next();
    return fail(res, 'You do not have permission to do this', 403);
  };
}

// Customer-facing (public site) auth — entirely separate identity space from admins. Reads a
// distinct `customer_token` cookie (not `token`, which admin sessions use) so the same browser
// can hold an admin session and a customer session at once without collision. Requires the JWT's
// `type` claim to be exactly 'customer' — an admin token has no `type` claim at all, so it's
// rejected here even though both are signed with the same JWT_SECRET.
function extractCustomerToken(req) {
  if (req.cookies && req.cookies.customer_token) return req.cookies.customer_token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function customerAuth(req, res, next) {
  const token = extractCustomerToken(req);
  if (!token) return fail(res, 'Authentication required', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') return fail(res, 'Invalid or expired token', 401);
    const result = await pool.query('SELECT token_version, is_active FROM customers WHERE id = $1', [decoded.id]);
    const customer = result.rows[0];
    if (!customer || customer.is_active === false) return fail(res, 'Invalid or expired token', 401);
    if ((decoded.tv || 1) !== customer.token_version) return fail(res, 'Your session has expired — please sign in again', 401);
    req.customer = decoded;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}

module.exports = { adminAuth, extractToken, requireSuperAdmin, checkPermission, customerAuth, extractCustomerToken };
