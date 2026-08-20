const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const sanitizeRichHtml = require('../../utils/sanitizeHtml');

const listComments = asyncHandler(async (req, res) => {
  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  const result = await pool.query(
    `SELECT comments.id, comments.content, comments.created_at, customers.name AS customer_name
     FROM comments JOIN customers ON customers.id = comments.customer_id
     WHERE comments.post_id = $1 ORDER BY comments.created_at ASC`,
    [post.rows[0].id]
  );
  ok(res, result.rows);
});

// Auto-published, no moderation queue — content still runs through the same sanitizer as rich-text
// admin fields as defense-in-depth against a pasted script payload, even though this is meant to be
// plain text.
const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return fail(res, 'Comment cannot be empty', 400);

  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  const clean = sanitizeRichHtml(content.trim()).slice(0, 2000);
  const result = await pool.query(
    `INSERT INTO comments (post_id, customer_id, content) VALUES ($1, $2, $3)
     RETURNING id, content, created_at`,
    [post.rows[0].id, req.customer.id, clean]
  );
  ok(res, { ...result.rows[0], customer_name: req.customer.name }, 201);
});

// Admin moderation view — every comment across every post, newest first.
const adminListComments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM comments');
  const dataResult = await pool.query(
    `SELECT comments.id, comments.content, comments.created_at,
            posts.title AS post_title, posts.slug AS post_slug,
            customers.name AS customer_name, customers.email AS customer_email
     FROM comments
     JOIN posts ON posts.id = comments.post_id
     JOIN customers ON customers.id = comments.customer_id
     ORDER BY comments.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const removeComment = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM comments WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return fail(res, 'Comment not found', 404);
  ok(res, { id: result.rows[0].id });
});

module.exports = { listComments, createComment, adminListComments, removeComment };
