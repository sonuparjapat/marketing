const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

// Returns the full permission catalog grouped by module, for building the
// department permission-matrix UI. Super Admin only (see routes).
const listPermissions = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM permissions ORDER BY module ASC, action ASC');
  const grouped = {};
  for (const perm of result.rows) {
    if (!grouped[perm.module]) grouped[perm.module] = [];
    grouped[perm.module].push(perm);
  }
  ok(res, grouped);
});

module.exports = { listPermissions };
