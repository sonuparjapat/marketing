const pool = require('../config/db');
const asyncHandler = require('./asyncHandler');
const { ok, fail } = require('./response');

/**
 * Builds standard admin CRUD handlers for a table.
 * `table` is always a hardcoded, developer-controlled string (never request input).
 * `allowedFields` whitelists which body keys may be written — column names never come from the client.
 */
// JSONB columns need to be passed as JSON strings — pg does not auto-serialize arrays/objects.
function serializeValue(v) {
  if (v !== null && typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
  return v;
}

function buildAdminCrud(table, { allowedFields, defaultOrder = 'id DESC' }) {
  return {
    list: asyncHandler(async (req, res) => {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const offset = (page - 1) * limit;

      const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      const total = totalResult.rows[0].count;

      const dataResult = await pool.query(
        `SELECT * FROM ${table} ORDER BY ${defaultOrder} LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      ok(res, { items: dataResult.rows, page, limit, total });
    }),

    getOne: asyncHandler(async (req, res) => {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!result.rows[0]) return fail(res, 'Not found', 404);
      ok(res, result.rows[0]);
    }),

    create: asyncHandler(async (req, res) => {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (!fields.length) return fail(res, 'No valid fields provided', 400);

      const values = fields.map((f) => serializeValue(req.body[f]));
      const columns = fields.join(', ');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

      const result = await pool.query(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      ok(res, result.rows[0], 201);
    }),

    update: asyncHandler(async (req, res) => {
      const fields = allowedFields.filter((f) => req.body[f] !== undefined);
      if (!fields.length) return fail(res, 'No valid fields provided', 400);

      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map((f) => serializeValue(req.body[f]));
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
        values
      );
      if (!result.rows[0]) return fail(res, 'Not found', 404);
      ok(res, result.rows[0]);
    }),

    remove: asyncHandler(async (req, res) => {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!result.rows[0]) return fail(res, 'Not found', 404);
      ok(res, { id: result.rows[0].id });
    }),
  };
}

module.exports = { buildAdminCrud };
