const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listStats = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM homepage_stats WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
  );
  ok(res, result.rows);
});

const allowedFields = ['value', 'label', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('homepage_stats', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

module.exports = {
  listStats,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createStat: adminCrud.create,
  updateStat: adminCrud.update,
  removeStat: adminCrud.remove,
};
