const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { buildAdminCrud } = require('../../utils/crud');

const getPage = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
  if (!result.rows[0]) return fail(res, 'Page not found', 404);
  ok(res, result.rows[0]);
});

const allowedFields = ['title', 'content', 'meta_title', 'meta_description', 'updated_at'];
const adminCrud = buildAdminCrud('pages', { allowedFields, defaultOrder: 'slug ASC' });

const updatePage = asyncHandler(async (req, res, next) => {
  req.body.updated_at = new Date();
  return adminCrud.update(req, res, next);
});

module.exports = {
  getPage,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  updatePage,
};
