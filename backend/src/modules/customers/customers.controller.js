const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { IS_PREMIUM_SQL } = require('../../utils/entitlements');

const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  if (req.query.search) {
    params.push(`%${req.query.search}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalResult = await pool.query(`SELECT COUNT(*)::int AS count FROM customers ${where}`, params);
  const dataResult = await pool.query(
    `SELECT id, name, email, is_active, last_login, created_at, ${IS_PREMIUM_SQL} AS is_premium
     FROM customers ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const getCustomer = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, is_active, last_login, created_at, ${IS_PREMIUM_SQL} AS is_premium
     FROM customers WHERE id = $1`,
    [req.params.id]
  );
  const customer = result.rows[0];
  if (!customer) return fail(res, 'Customer not found', 404);

  const [comments, reviews, tickets, subscriptions] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM comments WHERE customer_id = $1', [req.params.id]),
    pool.query('SELECT COUNT(*)::int AS count FROM testimonials WHERE customer_id = $1', [req.params.id]),
    pool.query('SELECT COUNT(*)::int AS count FROM support_tickets WHERE customer_id = $1', [req.params.id]),
    pool.query(
      `SELECT cs.id, cs.status, cs.started_at, cs.expires_at, p.name AS plan_name
       FROM customer_subscriptions cs JOIN subscription_plans p ON p.id = cs.plan_id
       WHERE cs.customer_id = $1 ORDER BY cs.created_at DESC`,
      [req.params.id]
    ),
  ]);

  ok(res, {
    ...customer,
    comment_count: comments.rows[0].count,
    review_count: reviews.rows[0].count,
    ticket_count: tickets.rows[0].count,
    subscriptions: subscriptions.rows,
  });
});

// Admin can only toggle account status here — password resets stay customer self-service
// (forgot-password), and nothing else about a customer's own data is admin-editable.
const updateCustomer = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  if (is_active === undefined) return fail(res, 'Nothing to update', 400);

  const result = await pool.query(
    'UPDATE customers SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
    [is_active, req.params.id]
  );
  if (!result.rows[0]) return fail(res, 'Customer not found', 404);
  ok(res, result.rows[0]);
});

module.exports = { listCustomers, getCustomer, updateCustomer };
