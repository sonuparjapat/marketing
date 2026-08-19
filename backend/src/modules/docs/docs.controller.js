const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const VALID_TYPES = ['user-manual', 'testing', 'developer'];

const listDocs = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT doc_type, title, updated_at FROM docs ORDER BY doc_type ASC');
  ok(res, result.rows);
});

const getDoc = asyncHandler(async (req, res) => {
  if (!VALID_TYPES.includes(req.params.type)) return fail(res, 'Unknown doc type', 404);
  const result = await pool.query('SELECT * FROM docs WHERE doc_type = $1', [req.params.type]);
  if (!result.rows[0]) return fail(res, 'Doc not found', 404);
  ok(res, result.rows[0]);
});

const updateDoc = asyncHandler(async (req, res) => {
  if (!VALID_TYPES.includes(req.params.type)) return fail(res, 'Unknown doc type', 404);
  const { content } = req.body;
  if (typeof content !== 'string') return fail(res, 'content (string) is required', 400);

  const result = await pool.query(
    `UPDATE docs SET content = $1, updated_at = NOW() WHERE doc_type = $2 RETURNING *`,
    [content, req.params.type]
  );
  if (!result.rows[0]) return fail(res, 'Doc not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { listDocs, getDoc, updateDoc };
