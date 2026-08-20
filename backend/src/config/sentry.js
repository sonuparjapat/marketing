const Sentry = require('@sentry/node');

const isConfigured = Boolean(process.env.SENTRY_DSN);

// Optional, same pattern as mailer.js / aws.js — the app runs identically without a DSN, just with
// no error tracking, rather than failing to boot.
function init() {
  if (!isConfigured) {
    console.warn('[sentry] SENTRY_DSN not set — error tracking disabled');
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

module.exports = { init, Sentry, isConfigured };
