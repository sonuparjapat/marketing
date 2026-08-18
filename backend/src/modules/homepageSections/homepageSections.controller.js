const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const listSections = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM homepage_sections ORDER BY sort_order ASC, id ASC');
  ok(res, result.rows);
});

const adminListSections = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM homepage_sections ORDER BY sort_order ASC, id ASC');
  ok(res, { items: result.rows, page: 1, limit: result.rows.length, total: result.rows.length });
});

const toggleSection = asyncHandler(async (req, res) => {
  const { is_enabled } = req.body;
  if (typeof is_enabled !== 'boolean') return fail(res, 'is_enabled (boolean) is required', 400);

  const result = await pool.query(
    'UPDATE homepage_sections SET is_enabled = $1 WHERE id = $2 RETURNING *',
    [is_enabled, req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { listSections, adminListSections, toggleSection };
