const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const slugify = require('../../utils/slugify');
const { buildAdminCrud } = require('../../utils/crud');

const listServices = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM services WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC'
  );
  ok(res, result.rows);
});

const getService = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM services WHERE slug = $1 AND is_active = TRUE', [req.params.slug]);
  if (!result.rows[0]) return fail(res, 'Service not found', 404);

  const related = await pool.query(
    `SELECT id, title, slug, client_name, results_json, cover_image FROM case_studies
     WHERE is_published = TRUE AND tags @> $1::jsonb ORDER BY created_at DESC LIMIT 3`,
    [JSON.stringify([result.rows[0].title])]
  );

  ok(res, { ...result.rows[0], related_case_studies: related.rows });
});

const allowedFields = [
  'title', 'slug', 'short_description', 'full_description', 'icon',
  'features_json', 'is_active', 'sort_order',
];
const adminCrud = buildAdminCrud('services', { allowedFields, defaultOrder: 'sort_order ASC, id ASC' });

const createService = asyncHandler(async (req, res, next) => {
  if (!req.body.slug && req.body.title) req.body.slug = slugify(req.body.title);
  return adminCrud.create(req, res, next);
});

const reorderServices = asyncHandler(async (req, res) => {
  const { order } = req.body; // array of { id, sort_order }
  if (!Array.isArray(order)) return fail(res, 'order must be an array of { id, sort_order }', 400);

  await Promise.all(
    order.map(({ id, sort_order }) => pool.query('UPDATE services SET sort_order = $1 WHERE id = $2', [sort_order, id]))
  );
  ok(res, { updated: order.length });
});

module.exports = {
  listServices,
  getService,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createService,
  updateService: adminCrud.update,
  removeService: adminCrud.remove,
  reorderServices,
};
