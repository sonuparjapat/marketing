const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const registerToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return fail(res, 'token is required', 400);

  await pool.query(
    `INSERT INTO push_tokens (admin_id, token, platform) VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET admin_id = EXCLUDED.admin_id, platform = EXCLUDED.platform`,
    [req.admin.id, token, platform || null]
  );
  ok(res, { registered: true }, 201);
});

const unregisterToken = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM push_tokens WHERE token = $1', [req.params.token]);
  ok(res, { unregistered: true });
});

module.exports = { registerToken, unregisterToken };
