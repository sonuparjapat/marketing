const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM notifications');
  const unreadResult = await pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = FALSE');
  const dataResult = await pool.query(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count, unread: unreadResult.rows[0].count });
});

const markRead = asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
  ok(res, { marked: true });
});

const markAllRead = asyncHandler(async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
  ok(res, { marked: true });
});

module.exports = { listNotifications, markRead, markAllRead };
