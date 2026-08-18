const pool = require('../../config/db');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, fail } = require('../../utils/response');

const PUBLIC_KEYS = [
  'agency_name', 'tagline', 'phone', 'email', 'whatsapp_number', 'address',
  'instagram_url', 'linkedin_url', 'youtube_url', 'twitter_url',
  'default_meta_title', 'default_meta_description', 'ga_measurement_id',
  'agency_legal_name', 'privacy_contact_email', 'notice_period', 'budget_ranges',
  'primary_color', 'accent_color',
];

const getPublicSettings = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT key, value FROM settings WHERE key = ANY($1)', [PUBLIC_KEYS]);
  const settings = {};
  for (const row of result.rows) settings[row.key] = row.value;
  ok(res, settings);
});

const listAllSettings = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM settings ORDER BY key ASC');
  ok(res, result.rows);
});

const upsertSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key) return fail(res, 'key is required', 400);

  const result = await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING *`,
    [key, value ?? null]
  );
  ok(res, result.rows[0]);
});

const deleteSetting = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING key', [req.params.key]);
  if (!result.rows[0]) return fail(res, 'Setting not found', 404);
  ok(res, { key: result.rows[0].key });
});

module.exports = { getPublicSettings, listAllSettings, upsertSetting, deleteSetting };
