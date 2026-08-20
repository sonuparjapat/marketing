const pool = require('../config/db');

// Reusable subquery fragment for "does this customers row currently have any active subscription" —
// used wherever a customer profile is selected (customerAuth.controller.js, admin customers.controller.js)
// so `is_premium` is always derived from live subscription state rather than a manually-flipped column.
// Must be used against a query that has `customers` as a table/alias named exactly `customers`.
const IS_PREMIUM_SQL = `EXISTS (
  SELECT 1 FROM customer_subscriptions cs
  WHERE cs.customer_id = customers.id AND cs.status = 'active' AND cs.expires_at > NOW()
)`;

// Does this customer currently have an active subscription that includes the given service
// (by premium_services.id, the same id posts.required_service_id points at)? Reused by the posts
// controller (premium blog gating) and any future gated feature.
async function hasActiveService(customerId, serviceId) {
  const result = await pool.query(
    `SELECT 1 FROM customer_subscriptions cs
     JOIN plan_services ps ON ps.plan_id = cs.plan_id
     WHERE cs.customer_id = $1 AND cs.status = 'active' AND cs.expires_at > NOW() AND ps.service_id = $2
     LIMIT 1`,
    [customerId, serviceId]
  );
  return result.rows.length > 0;
}

module.exports = { IS_PREMIUM_SQL, hasActiveService };
