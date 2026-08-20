const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const slugify = require('../../utils/slugify');
const { buildAdminCrud } = require('../../utils/crud');

const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
  const offset = (page - 1) * limit;

  const conditions = ['is_published = TRUE'];
  const params = [];

  if (req.query.category) {
    params.push(req.query.category);
    conditions.push(`category = $${params.length}`);
  }
  if (req.query.tag) {
    params.push(JSON.stringify([req.query.tag]));
    conditions.push(`tags @> $${params.length}::jsonb`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM posts ${where}`, params);
  const dataResult = await pool.query(
    `SELECT id, title, slug, excerpt, cover_image, cover_image_alt, category, tags, author, views, created_at
     FROM posts ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const getPost = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT posts.*, team.name AS author_name, team.photo AS author_photo,
            team.designation AS author_designation, team.bio AS author_bio, team.linkedin_url AS author_linkedin_url
     FROM posts LEFT JOIN team ON team.id = posts.author_id
     WHERE posts.slug = $1 AND posts.is_published = TRUE`,
    [req.params.slug]
  );
  if (!result.rows[0]) return fail(res, 'Post not found', 404);

  await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [result.rows[0].id]);
  const related = await pool.query(
    `SELECT id, title, slug, excerpt, cover_image, cover_image_alt FROM posts
     WHERE category = $1 AND id != $2 AND is_published = TRUE ORDER BY created_at DESC LIMIT 3`,
    [result.rows[0].category, result.rows[0].id]
  );

  ok(res, { ...result.rows[0], views: result.rows[0].views + 1, related: related.rows });
});

const allowedFields = [
  'title', 'slug', 'excerpt', 'content', 'cover_image', 'cover_image_alt', 'category', 'tags',
  'author', 'author_id', 'meta_title', 'meta_description', 'is_published', 'updated_at',
];
const adminCrud = buildAdminCrud('posts', { allowedFields, defaultOrder: 'created_at DESC', htmlFields: ['content'] });

// Custom admin list (rather than the generic buildAdminCrud list) — supports title search and
// category filtering server-side, since the admin post list's search/category UI filters across
// all posts, not just the current page.
const adminListPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.category) {
    params.push(req.query.category);
    conditions.push(`category = $${params.length}`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM posts ${where}`, params);
  const dataResult = await pool.query(
    `SELECT id, title, slug, cover_image, category, views, is_published, updated_at
     FROM posts ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const createPost = asyncHandler(async (req, res, next) => {
  if (!req.body.slug && req.body.title) req.body.slug = slugify(req.body.title);
  return adminCrud.create(req, res, next);
});

const updatePost = asyncHandler(async (req, res, next) => {
  req.body.updated_at = new Date();
  return adminCrud.update(req, res, next);
});

module.exports = {
  listPosts,
  getPost,
  adminList: adminListPosts,
  adminGetOne: adminCrud.getOne,
  createPost,
  updatePost,
  removePost: adminCrud.remove,
};
