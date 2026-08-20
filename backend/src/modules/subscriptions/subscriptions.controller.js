const crypto = require('crypto');
const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');
const { razorpay, isConfigured } = require('../../config/razorpay');
const { grantSubscription, logPaymentEvent, sendReceiptEmail, customerContact } = require('./subscriptions.service');

// POST /subscriptions/checkout { plan_id } — creates a local `payments` row (status='created')
// and a matching Razorpay order, returns what the client needs to open Checkout.js/RazorpayCheckout.
const checkout = asyncHandler(async (req, res) => {
  if (!isConfigured) return fail(res, 'Payments are not configured yet', 503);
  const { plan_id } = req.body;
  if (!plan_id) return fail(res, 'plan_id is required', 400);

  const planResult = await pool.query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE', [plan_id]);
  const plan = planResult.rows[0];
  if (!plan) return fail(res, 'This plan is not available', 404);

  const order = await razorpay.orders.create({
    amount: plan.price_paise,
    currency: 'INR',
    receipt: `sub_${req.customer.id}_${Date.now()}`,
    notes: { customer_id: String(req.customer.id), plan_id: String(plan.id) },
  });

  const paymentResult = await pool.query(
    `INSERT INTO payments (customer_id, plan_id, razorpay_order_id, amount_paise, status)
     VALUES ($1, $2, $3, $4, 'created') RETURNING id`,
    [req.customer.id, plan.id, order.id, plan.price_paise]
  );

  await logPaymentEvent(pool, {
    event_type: 'order_created',
    razorpay_order_id: order.id,
    customer_id: req.customer.id,
    metadata: { plan_id: plan.id, amount_paise: plan.price_paise, payment_id: paymentResult.rows[0].id },
  });

  ok(res, {
    order_id: order.id,
    amount: plan.price_paise,
    currency: 'INR',
    key_id: process.env.RAZORPAY_KEY_ID,
    plan_name: plan.name,
  });
});

// POST /subscriptions/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature } — the
// client-side confirmation path. Locks the payment row, re-checks status inside the lock (a racing
// webhook delivery may have already granted this exact payment), verifies the HMAC signature, then
// grants. Idempotent: calling this twice for the same order is always a safe no-op the second time.
const verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, 'Missing payment verification fields', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const paymentResult = await client.query(
      `SELECT * FROM payments WHERE razorpay_order_id = $1 AND customer_id = $2 FOR UPDATE`,
      [razorpay_order_id, req.customer.id]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      await client.query('ROLLBACK');
      return fail(res, 'Payment not found', 404);
    }

    if (payment.status === 'paid') {
      const subResult = await client.query('SELECT * FROM customer_subscriptions WHERE payment_id = $1', [payment.id]);
      await client.query('COMMIT');
      return ok(res, { alreadyProcessed: true, subscription: subResult.rows[0] });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await client.query(`UPDATE payments SET status = 'failed', razorpay_payment_id = $1 WHERE id = $2`, [
        razorpay_payment_id,
        payment.id,
      ]);
      await logPaymentEvent(client, {
        event_type: 'signature_mismatch',
        razorpay_order_id,
        razorpay_payment_id,
        customer_id: req.customer.id,
      });
      await client.query('COMMIT');
      return fail(res, 'Payment verification failed', 400);
    }

    const { plan, subscription } = await grantSubscription(client, payment, { razorpay_payment_id, razorpay_signature });
    await logPaymentEvent(client, {
      event_type: 'payment_verified',
      razorpay_order_id,
      razorpay_payment_id,
      customer_id: req.customer.id,
      metadata: { plan_id: payment.plan_id },
    });
    await client.query('COMMIT');

    const customer = await customerContact(payment.customer_id);
    sendReceiptEmail(customer, plan, subscription);

    ok(res, { subscription });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /subscriptions/me — the customer's full subscription history with a live-derived active flag.
const mySubscriptions = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT cs.id, cs.plan_id, p.name AS plan_name, cs.started_at, cs.expires_at, cs.status,
            (cs.status = 'active' AND cs.expires_at > NOW()) AS is_currently_active
     FROM customer_subscriptions cs JOIN subscription_plans p ON p.id = cs.plan_id
     WHERE cs.customer_id = $1 ORDER BY cs.created_at DESC`,
    [req.customer.id]
  );
  ok(res, result.rows);
});

module.exports = { checkout, verify, mySubscriptions };
