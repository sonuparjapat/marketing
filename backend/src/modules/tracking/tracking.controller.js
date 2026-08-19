const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const trackPageview = asyncHandler(async (req, res) => {
  const { path, referrer } = req.body;
  if (path) {
    pool
      .query('INSERT INTO page_views (path, referrer) VALUES ($1, $2)', [String(path).slice(0, 300), referrer ? String(referrer).slice(0, 300) : null])
      .catch((err) => console.error('[tracking] Failed to record page view:', err.message));
  }
  ok(res, { tracked: true }, 201);
});

module.exports = { trackPageview };
