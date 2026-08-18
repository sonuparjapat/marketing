const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const slugify = require('../../utils/slugify');
const { buildAdminCrud } = require('../../utils/crud');

const listCaseStudies = asyncHandler(async (req, res) => {
  const conditions = ['is_published = TRUE'];
  const params = [];

  if (req.query.industry) {
    params.push(req.query.industry);
    conditions.push(`client_industry = $${params.length}`);
  }
  if (req.query.tag) {
    params.push(JSON.stringify([req.query.tag]));
    conditions.push(`tags @> $${params.length}::jsonb`);
  }
  if (req.query.featured === 'true') {
    conditions.push('is_featured = TRUE');
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await pool.query(
    `SELECT id, title, slug, client_name, client_industry, results_json, cover_image, tags, is_featured
     FROM case_studies ${where} ORDER BY created_at DESC`,
    params
  );
  ok(res, result.rows);
});

const getCaseStudy = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM case_studies WHERE slug = $1 AND is_published = TRUE', [req.params.slug]);
  if (!result.rows[0]) return fail(res, 'Case study not found', 404);

  const neighbors = await pool.query(
    `SELECT slug, title FROM case_studies WHERE is_published = TRUE ORDER BY created_at DESC`
  );
  const idx = neighbors.rows.findIndex((r) => r.slug === req.params.slug);
  const prev = idx > 0 ? neighbors.rows[idx - 1] : null;
  const next = idx >= 0 && idx < neighbors.rows.length - 1 ? neighbors.rows[idx + 1] : null;

  ok(res, { ...result.rows[0], prev, next });
});

const allowedFields = [
  'title', 'slug', 'client_name', 'client_industry', 'challenge', 'solution',
  'results_json', 'cover_image', 'tags', 'is_featured', 'is_published',
];
const adminCrud = buildAdminCrud('case_studies', { allowedFields, defaultOrder: 'created_at DESC' });

const createCaseStudy = asyncHandler(async (req, res, next) => {
  if (!req.body.slug && req.body.title) req.body.slug = slugify(req.body.title);
  return adminCrud.create(req, res, next);
});

module.exports = {
  listCaseStudies,
  getCaseStudy,
  adminList: adminCrud.list,
  adminGetOne: adminCrud.getOne,
  createCaseStudy,
  updateCaseStudy: adminCrud.update,
  removeCaseStudy: adminCrud.remove,
};
