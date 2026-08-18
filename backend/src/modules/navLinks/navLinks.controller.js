const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const listNavLinks = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM nav_links WHERE is_active = TRUE ORDER BY location, sort_order ASC, id ASC'
  );
  const grouped = { header: [], footer: [] };
  for (const row of result.rows) {
    if (!grouped[row.location]) grouped[row.location] = [];
    grouped[row.location].push(row);
  }
  ok(res, grouped);
});

const allowedFields = ['label', 'href', 'location', 'sort_order', 'is_active'];
const adminCrud = buildAdminCrud('nav_links', { allowedFields, defaultOrder: 'location ASC, sort_order ASC' });

module.exports = {
  listNavLinks,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createNavLink: adminCrud.create,
  updateNavLink: adminCrud.update,
  removeNavLink: adminCrud.remove,
};
