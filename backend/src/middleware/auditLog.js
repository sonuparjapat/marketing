const pool = require('../config/db');

const ACTION_BY_METHOD = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

/**
 * Logs every successful admin mutation (POST/PUT/PATCH/DELETE under /api/admin/*)
 * to admin_logs, without requiring each module to call it explicitly. Read-only
 * GET requests and admin auth routes (login/logout/me) are skipped.
 */
function auditLog(req, res, next) {
  const action = ACTION_BY_METHOD[req.method];
  if (!action || req.path.startsWith('/login') || req.path.startsWith('/logout')) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400 && req.admin) {
      const moduleName = req.baseUrl.replace('/api/admin/', '') || req.baseUrl.replace('/api/admin', 'admin');
      const recordId = req.params.id || body?.data?.id;
      pool
        .query('INSERT INTO admin_logs (admin_id, action, module, record_id) VALUES ($1, $2, $3, $4)', [
          req.admin.id,
          action,
          moduleName,
          recordId ? String(recordId) : null,
        ])
        .catch((err) => console.error('[audit] Failed to write admin log:', err.message));
    }
    return originalJson(body);
  };
  next();
}

module.exports = auditLog;
