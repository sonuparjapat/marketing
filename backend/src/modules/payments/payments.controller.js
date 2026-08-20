const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { razorpay, isConfigured } = require('../../config/razorpay');
const { logPaymentEvent } = require('../subscriptions/subscriptions.service');

// The transaction log the admin asked for — every payment attempt (not just successful ones),
// who it belongs to, what plan, current status. auditLog middleware separately covers admin
// *actions* on this resource (e.g. the refund below); this is the money trail itself.
const adminList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const totalResult = await pool.query('SELECT COUNT(*)::int AS count FROM payments');
  const dataResult = await pool.query(
    `SELECT pay.id, pay.customer_id, c.name AS customer_name, c.email AS customer_email,
            pay.plan_id, p.name AS plan_name, pay.razorpay_order_id, pay.razorpay_payment_id,
            pay.amount_paise, pay.status, pay.created_at
     FROM payments pay
     JOIN customers c ON c.id = pay.customer_id
     JOIN subscription_plans p ON p.id = pay.plan_id
     ORDER BY pay.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  ok(res, { items: dataResult.rows, page, limit, total: totalResult.rows[0].count });
});

const adminLogsForPayment = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM payment_logs WHERE razorpay_order_id = (SELECT razorpay_order_id FROM payments WHERE id = $1)
     ORDER BY created_at ASC`,
    [req.params.id]
  );
  ok(res, result.rows);
});

// Full revocation in one click: refunds via Razorpay, marks the payment refunded, and immediately
// drops the linked subscription out of every "active" check (they all test
// status = 'active' AND expires_at > NOW()) by flipping its status to 'refunded'.
const refundPayment = asyncHandler(async (req, res) => {
  if (!isConfigured) return fail(res, 'Payments are not configured', 503);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const paymentResult = await client.query('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [req.params.id]);
    const payment = paymentResult.rows[0];
    if (!payment) {
      await client.query('ROLLBACK');
      return fail(res, 'Payment not found', 404);
    }
    if (payment.status !== 'paid') {
      await client.query('ROLLBACK');
      return fail(res, 'Only a paid payment can be refunded', 400);
    }

    await razorpay.payments.refund(payment.razorpay_payment_id, { amount: payment.amount_paise });

    await client.query(`UPDATE payments SET status = 'refunded' WHERE id = $1`, [payment.id]);
    await client.query(`UPDATE customer_subscriptions SET status = 'refunded' WHERE payment_id = $1`, [payment.id]);
    await logPaymentEvent(client, {
      event_type: 'admin_refund',
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      customer_id: payment.customer_id,
      metadata: { admin_id: req.admin.id },
    });
    await client.query('COMMIT');
    ok(res, { refunded: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { adminList, adminLogsForPayment, refundPayment };
