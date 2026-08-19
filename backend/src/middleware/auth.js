const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function extractToken(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function adminAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return fail(res, 'Authentication required', 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}

// Editors can manage content; only super_admin manages other admins, settings and appearance.
function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== 'super_admin') return fail(res, 'Only a super admin can do this', 403);
  next();
}

module.exports = { adminAuth, extractToken, requireSuperAdmin };
