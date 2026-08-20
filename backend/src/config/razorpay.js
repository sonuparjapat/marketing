const Razorpay = require('razorpay');

const isConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const razorpay = isConfigured
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

if (!isConfigured) {
  console.warn('[razorpay] RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set — payments are disabled until configured.');
}

module.exports = { razorpay, isConfigured };
