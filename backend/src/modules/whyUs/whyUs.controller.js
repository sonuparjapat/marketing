const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listWhyUs = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM why_us_points WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
  );
  ok(res, result.rows);
});

const allowedFields = ['point', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('why_us_points', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

module.exports = {
  listWhyUs,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createPoint: adminCrud.create,
  updatePoint: adminCrud.update,
  removePoint: adminCrud.remove,
};
