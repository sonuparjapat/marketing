const fs = require('fs');
const path = require('path');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

const listMedia = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 40));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM media');
  const dataResult = await pool.query(
    'SELECT * FROM media ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const removeMedia = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM media WHERE id = $1 RETURNING *', [req.params.id]);
  const row = result.rows[0];
  if (!row) return fail(res, 'Not found', 404);

  // Best-effort local file cleanup — never fails the request if the file is remote (S3) or already gone.
  if (row.filename && row.url.includes('/uploads/')) {
    const localPath = path.join(UPLOADS_DIR, row.url.split('/uploads/').pop());
    fs.unlink(localPath, () => {});
  }

  ok(res, { id: row.id });
});

module.exports = { listMedia, removeMedia };
