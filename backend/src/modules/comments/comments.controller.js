const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const sanitizeRichHtml = require('../../utils/sanitizeHtml');

// Returns a flat list (with parent_id) rather than a nested tree — the frontend nests it, which
// keeps this query simple and lets the client re-nest however its UI needs to.
const listComments = asyncHandler(async (req, res) => {
  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  const result = await pool.query(
    `SELECT comments.id, comments.content, comments.created_at, comments.parent_id, comments.reply_to_id,
            customers.name AS customer_name,
            reply_to_customer.name AS reply_to_name,
            COALESCE(v.like_count, 0)::int AS like_count,
            COALESCE(v.dislike_count, 0)::int AS dislike_count,
            my_vote.vote_type AS my_vote
     FROM comments
     JOIN customers ON customers.id = comments.customer_id
     LEFT JOIN comments reply_to_comment ON reply_to_comment.id = comments.reply_to_id
     LEFT JOIN customers reply_to_customer ON reply_to_customer.id = reply_to_comment.customer_id
     LEFT JOIN (
       SELECT comment_id,
              COUNT(*) FILTER (WHERE vote_type = 'like') AS like_count,
              COUNT(*) FILTER (WHERE vote_type = 'dislike') AS dislike_count
       FROM comment_votes GROUP BY comment_id
     ) v ON v.comment_id = comments.id
     LEFT JOIN comment_votes my_vote ON my_vote.comment_id = comments.id AND my_vote.customer_id = $2
     WHERE comments.post_id = $1 ORDER BY comments.created_at ASC`,
    [post.rows[0].id, req.customer?.id || null]
  );
  ok(res, result.rows);
});

// Auto-published, no moderation queue — content still runs through the same sanitizer as rich-text
// admin fields as defense-in-depth against a pasted script payload, even though this is meant to be
// plain text. `parent_id` in the request body is "the comment this reply is aimed at" from the
// client's perspective — it may itself be a reply. That gets resolved here into the real stored
// shape: `parent_id` always collapses to the top-level thread root (so replies never nest more than
// one level deep — see the schema comment for why), while `reply_to_id` keeps the exact comment
// that was replied to, purely so the UI can render "@Name" when that's a reply-to-a-reply.
const createComment = asyncHandler(async (req, res) => {
  const { content, parent_id: replyTargetId } = req.body;
  if (!content || !content.trim()) return fail(res, 'Comment cannot be empty', 400);

  const post = await pool.query('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post.rows[0]) return fail(res, 'Post not found', 404);

  let topLevelParentId = null;
  let replyToId = null;
  if (replyTargetId) {
    const target = await pool.query('SELECT id, parent_id FROM comments WHERE id = $1 AND post_id = $2', [
      replyTargetId,
      post.rows[0].id,
    ]);
    if (!target.rows[0]) return fail(res, 'Cannot reply to a comment that does not exist on this post', 400);
    replyToId = target.rows[0].id;
    topLevelParentId = target.rows[0].parent_id || target.rows[0].id;
  }

  const clean = sanitizeRichHtml(content.trim()).slice(0, 2000);
  const result = await pool.query(
    `INSERT INTO comments (post_id, customer_id, parent_id, reply_to_id, content) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, content, created_at, parent_id, reply_to_id`,
    [post.rows[0].id, req.customer.id, topLevelParentId, replyToId, clean]
  );

  let replyToName = null;
  if (replyToId && replyToId !== topLevelParentId) {
    const target = await pool.query('SELECT customers.name FROM comments JOIN customers ON customers.id = comments.customer_id WHERE comments.id = $1', [
      replyToId,
    ]);
    replyToName = target.rows[0]?.name || null;
  }

  ok(res, { ...result.rows[0], customer_name: req.customer.name, reply_to_name: replyToName, like_count: 0, dislike_count: 0, my_vote: null }, 201);
});

// Same toggle/switch semantics as posts.controller.js's voteOnPost.
const voteOnComment = asyncHandler(async (req, res) => {
  const { vote_type } = req.body;
  if (!['like', 'dislike'].includes(vote_type)) return fail(res, "vote_type must be 'like' or 'dislike'", 400);

  const comment = await pool.query('SELECT id FROM comments WHERE id = $1', [req.params.id]);
  if (!comment.rows[0]) return fail(res, 'Comment not found', 404);

  const existing = await pool.query('SELECT vote_type FROM comment_votes WHERE comment_id = $1 AND customer_id = $2', [
    req.params.id,
    req.customer.id,
  ]);

  if (existing.rows[0]?.vote_type === vote_type) {
    await pool.query('DELETE FROM comment_votes WHERE comment_id = $1 AND customer_id = $2', [req.params.id, req.customer.id]);
  } else {
    await pool.query(
      `INSERT INTO comment_votes (comment_id, customer_id, vote_type) VALUES ($1, $2, $3)
       ON CONFLICT (comment_id, customer_id) DO UPDATE SET vote_type = $3`,
      [req.params.id, req.customer.id, vote_type]
    );
  }

  const counts = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE vote_type = 'like')::int AS like_count,
       COUNT(*) FILTER (WHERE vote_type = 'dislike')::int AS dislike_count
     FROM comment_votes WHERE comment_id = $1`,
    [req.params.id]
  );
  const myVote = existing.rows[0]?.vote_type === vote_type ? null : vote_type;
  ok(res, { like_count: counts.rows[0].like_count, dislike_count: counts.rows[0].dislike_count, my_vote: myVote });
});

// Admin moderation view — every comment across every post, newest first.
const adminListComments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM comments');
  const dataResult = await pool.query(
    `SELECT comments.id, comments.content, comments.created_at, comments.parent_id,
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

module.exports = { listComments, createComment, voteOnComment, adminListComments, removeComment };
