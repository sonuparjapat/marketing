const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const slugify = require('../../utils/slugify');
const { buildAdminCrud } = require('../../utils/crud');

const listCategories = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM blog_categories ORDER BY sort_order ASC, name ASC');
  ok(res, result.rows);
});

const allowedFields = ['name', 'slug', 'sort_order'];
const adminCrud = buildAdminCrud('blog_categories', { allowedFields, defaultOrder: 'sort_order ASC, name ASC' });

const createCategory = asyncHandler(async (req, res, next) => {
  if (!req.body.slug && req.body.name) req.body.slug = slugify(req.body.name);
  return adminCrud.create(req, res, next);
});

module.exports = {
  listCategories,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createCategory,
  updateCategory: adminCrud.update,
  removeCategory: adminCrud.remove,
};
