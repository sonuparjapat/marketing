import * as Sentry from '@sentry/nextjs';

// Client-side error tracking — optional, no-ops without NEXT_PUBLIC_SENTRY_DSN. Needs the
// NEXT_PUBLIC_ prefix (unlike the server-only SENTRY_DSN) since this file runs in the browser.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
