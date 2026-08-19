const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

// Returns the full permission catalog (one row per resource) grouped by module_group, for
// building the department permission-matrix UI — every resource always exposes all four
// create/read/update/delete flags, whether or not every action is backed by a real route.
// Super Admin only (see routes).
const listPermissions = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM permissions ORDER BY module_group ASC, label ASC');
  const grouped = {};
  for (const perm of result.rows) {
    if (!grouped[perm.module_group]) grouped[perm.module_group] = [];
    grouped[perm.module_group].push(perm);
  }
  ok(res, grouped);
});

module.exports = { listPermissions };
