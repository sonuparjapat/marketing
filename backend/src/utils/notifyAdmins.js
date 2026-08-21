const pool = require('../config/db');
const { emitToAdmins } = require('../socket');

async function sendExpoPush(tokens, { title, body, data }) {
  if (!tokens.length) return;
  const messages = tokens.map((token) => ({ to: token, sound: 'default', title, body, data }));
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('[push] Failed to send Expo push notifications:', err.message);
  }
}

/**
 * Notifies every connected admin dashboard (Socket.io) and every registered
 * admin mobile device (Expo push) of a new lead/callback. Safe to call with
 * zero registered devices — no-ops the push call and still emits the socket
 * event so an open admin tab updates live.
 *
 * Also persists to `notifications` — the single hook point for that table, so every existing
 * call site (leads/callbacks/support tickets) and every future one gets a browsable history for
 * free with zero controller changes.
 */
async function notifyAdmins(event, { title, body, data }) {
  emitToAdmins(event, data);

  pool
    .query('INSERT INTO notifications (event, title, body, data) VALUES ($1, $2, $3, $4)', [
      event,
      title || null,
      body || null,
      JSON.stringify(data ?? {}),
    ])
    .catch((e) => console.error('[notifications] Failed to persist notification:', e.message));

  const result = await pool.query('SELECT token FROM push_tokens');
  const tokens = result.rows.map((r) => r.token);
  await sendExpoPush(tokens, { title, body, data });
}

module.exports = { notifyAdmins };
