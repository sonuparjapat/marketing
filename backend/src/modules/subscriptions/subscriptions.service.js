const pool = require('../../config/db');
const { sendMail } = require('../../config/mailer');
const { subscriptionReceipt } = require('../../utils/emailTemplates');

// Shared core used by BOTH the client-side verify endpoint and the Razorpay webhook — the two
// paths that can race to grant the same payment. Caller must already hold a
// `SELECT ... FOR UPDATE` lock on `payment` and must have already confirmed `payment.status`
// is still 'created' (not 'paid') before calling this, inside the same transaction/client.
async function grantSubscription(client, payment, { razorpay_payment_id, razorpay_signature = null }) {
  const planResult = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [payment.plan_id]);
  const plan = planResult.rows[0];

  await client.query(
    `UPDATE payments SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2 WHERE id = $3`,
    [razorpay_payment_id, razorpay_signature, payment.id]
  );

  const subResult = await client.query(
    `INSERT INTO customer_subscriptions (customer_id, plan_id, expires_at, payment_id)
     VALUES ($1, $2, NOW() + ($3 || ' days')::interval, $4) RETURNING *`,
    [payment.customer_id, payment.plan_id, plan.duration_days, payment.id]
  );

  return { plan, subscription: subResult.rows[0] };
}

async function logPaymentEvent(client, { event_type, razorpay_order_id, razorpay_payment_id = null, customer_id = null, metadata = {} }) {
  await client.query(
    `INSERT INTO payment_logs (event_type, razorpay_order_id, razorpay_payment_id, customer_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [event_type, razorpay_order_id, razorpay_payment_id, customer_id, JSON.stringify(metadata)]
  );
}

// Fire-and-forget — never let a slow/broken SMTP block a payment response.
function sendReceiptEmail(customer, plan, subscription) {
  sendMail({
    to: customer.email,
    subject: 'Subscription confirmed',
    html: subscriptionReceipt(customer.name, plan.name, subscription.expires_at),
  }).catch((e) => console.error('[mailer] subscription receipt failed:', e.message));
}

async function customerContact(customerId) {
  const result = await pool.query('SELECT name, email FROM customers WHERE id = $1', [customerId]);
  return result.rows[0];
}

module.exports = { grantSubscription, logPaymentEvent, sendReceiptEmail, customerContact };
