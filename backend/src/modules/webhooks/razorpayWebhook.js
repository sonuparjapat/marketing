const crypto = require('crypto');
const express = require('express');
const pool = require('../../config/db');
const { isConfigured } = require('../../config/razorpay');
const { grantSubscription, logPaymentEvent, sendReceiptEmail, customerContact } = require('../subscriptions/subscriptions.service');

// Mounted in app.js with express.raw() BEFORE the global express.json() parser — signature
// verification needs the exact bytes Razorpay signed, and once express.json() has parsed the body
// those original bytes are gone. Uses a SEPARATE secret (RAZORPAY_WEBHOOK_SECRET) from the
// checkout HMAC (RAZORPAY_KEY_SECRET) — Razorpay signs webhook deliveries independently of any
// single checkout, by design.
//
// This is the fallback confirmation path: if the customer's browser tab closes before the
// client-side POST /subscriptions/verify completes, this webhook is what still grants access.
// Reuses subscriptions.service's grantSubscription, guarded by the identical FOR UPDATE +
// already-paid short-circuit pattern, so whichever of "verify" or "webhook" arrives first wins and
// the second is always a safe no-op.
const router = express.Router();

router.post('/', async (req, res) => {
  if (!isConfigured || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Webhook not configured' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, from express.raw()
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!signature || signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Malformed payload' });
  }

  const event = payload.event;

  try {
    if (event === 'payment.captured') {
      const entity = payload.payload.payment.entity;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const paymentResult = await client.query('SELECT * FROM payments WHERE razorpay_order_id = $1 FOR UPDATE', [
          entity.order_id,
        ]);
        const payment = paymentResult.rows[0];
        if (!payment) {
          // Order not created through our checkout flow — nothing to reconcile. Ack anyway so
          // Razorpay doesn't keep retrying a delivery we'll never be able to match.
          await client.query('ROLLBACK');
          return res.json({ success: true });
        }

        if (payment.status !== 'paid') {
          const { plan, subscription } = await grantSubscription(client, payment, { razorpay_payment_id: entity.id });
          await logPaymentEvent(client, {
            event_type: 'webhook_payment_captured',
            razorpay_order_id: entity.order_id,
            razorpay_payment_id: entity.id,
            customer_id: payment.customer_id,
            metadata: { plan_id: payment.plan_id },
          });
          await client.query('COMMIT');
          const customer = await customerContact(payment.customer_id);
          sendReceiptEmail(customer, plan, subscription);
        } else {
          await client.query('COMMIT');
        }
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else if (event === 'payment.failed') {
      const entity = payload.payload.payment.entity;
      await pool.query(`UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'created'`, [
        entity.order_id,
      ]);
      await logPaymentEvent(pool, {
        event_type: 'webhook_payment_failed',
        razorpay_order_id: entity.order_id,
        razorpay_payment_id: entity.id,
        metadata: { error: entity.error_description || null },
      });
    }
    // Every other event type is acknowledged and ignored — we only act on the two above.

    res.json({ success: true });
  } catch (err) {
    console.error('[razorpay webhook] processing error:', err.message);
    // 500 so Razorpay retries delivery — this is a real processing failure, not a "nothing to do".
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

module.exports = router;
