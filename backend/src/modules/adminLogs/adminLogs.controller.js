const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM admin_logs');
  const dataResult = await pool.query(
    `SELECT admin_logs.*, admins.name AS admin_name, admins.email AS admin_email
     FROM admin_logs
     LEFT JOIN admins ON admins.id = admin_logs.admin_id
     ORDER BY admin_logs.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

module.exports = { listLogs };
