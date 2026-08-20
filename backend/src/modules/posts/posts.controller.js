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
  const orderBy = req.query.sort === 'trending' ? 'views DESC, created_at DESC' : 'created_at DESC';
  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM posts ${where}`, params);
  const dataResult = await pool.query(
    `SELECT id, title, slug, excerpt, cover_image, cover_image_alt, category, tags, author, views, created_at, updated_at
     FROM posts ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

// Distinct tags across published posts with a usage count, for the blog's tag-browsing chips —
// tags live as a JSONB array per post rather than their own table, so this flattens them in SQL.
const listTags = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT tag, COUNT(*)::int AS count
    FROM posts, jsonb_array_elements_text(tags) AS tag
    WHERE is_published = TRUE
    GROUP BY tag ORDER BY count DESC, tag ASC
  `);
  ok(res, result.rows);
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
  const post = result.rows[0];

  const [, related, voteCounts, myVote] = await Promise.all([
    pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [post.id]),
    pool.query(
      `SELECT id, title, slug, excerpt, cover_image, cover_image_alt FROM posts
       WHERE category = $1 AND id != $2 AND is_published = TRUE ORDER BY created_at DESC LIMIT 3`,
      [post.category, post.id]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE vote_type = 'like')::int AS like_count,
         COUNT(*) FILTER (WHERE vote_type = 'dislike')::int AS dislike_count
       FROM post_votes WHERE post_id = $1`,
      [post.id]
    ),
    req.customer
      ? pool.query('SELECT vote_type FROM post_votes WHERE post_id = $1 AND customer_id = $2', [post.id, req.customer.id])
      : Promise.resolve({ rows: [] }),
  ]);

  ok(res, {
    ...post,
    views: post.views + 1,
    related: related.rows,
    like_count: voteCounts.rows[0].like_count,
    dislike_count: voteCounts.rows[0].dislike_count,
    my_vote: myVote.rows[0]?.vote_type || null,
  });
});

// A lightweight companion to getPost — the post detail page is fetched server-side (no access to
// the visitor's Bearer token, which lives in browser localStorage, not a cookie the server forwards
// automatically), so "did I already vote" has to be fetched separately, client-side, once
// useCustomerAuth() confirms someone is actually signed in.
const getMyPostVote = asyncHandler(async (req, res) => {
  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  const result = await pool.query('SELECT vote_type FROM post_votes WHERE post_id = $1 AND customer_id = $2', [
    post.rows[0].id,
    req.customer.id,
  ]);
  ok(res, { vote_type: result.rows[0]?.vote_type || null });
});

// Toggling the same vote_type again removes it (undo); switching from like to dislike (or back)
// updates the existing row via ON CONFLICT rather than erroring on the UNIQUE(post_id, customer_id).
const voteOnPost = asyncHandler(async (req, res) => {
  const { vote_type } = req.body;
  if (!['like', 'dislike'].includes(vote_type)) return fail(res, "vote_type must be 'like' or 'dislike'", 400);

  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  const existing = await pool.query('SELECT vote_type FROM post_votes WHERE post_id = $1 AND customer_id = $2', [
    post.rows[0].id,
    req.customer.id,
  ]);

  if (existing.rows[0]?.vote_type === vote_type) {
    await pool.query('DELETE FROM post_votes WHERE post_id = $1 AND customer_id = $2', [post.rows[0].id, req.customer.id]);
  } else {
    await pool.query(
      `INSERT INTO post_votes (post_id, customer_id, vote_type) VALUES ($1, $2, $3)
       ON CONFLICT (post_id, customer_id) DO UPDATE SET vote_type = $3`,
      [post.rows[0].id, req.customer.id, vote_type]
    );
  }

  const counts = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE vote_type = 'like')::int AS like_count,
       COUNT(*) FILTER (WHERE vote_type = 'dislike')::int AS dislike_count
     FROM post_votes WHERE post_id = $1`,
    [post.rows[0].id]
  );
  const myVote = existing.rows[0]?.vote_type === vote_type ? null : vote_type;
  ok(res, { like_count: counts.rows[0].like_count, dislike_count: counts.rows[0].dislike_count, my_vote: myVote });
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
  listTags,
  getPost,
  getMyPostVote,
  voteOnPost,
  adminList: adminListPosts,
  adminGetOne: adminCrud.getOne,
  createPost,
  updatePost,
  removePost: adminCrud.remove,
};
