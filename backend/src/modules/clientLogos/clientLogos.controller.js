const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listLogos = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM client_logos WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
  );
  ok(res, result.rows);
});

const allowedFields = ['name', 'logo_url', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('client_logos', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

module.exports = {
  listLogos,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createLogo: adminCrud.create,
  updateLogo: adminCrud.update,
  removeLogo: adminCrud.remove,
};
