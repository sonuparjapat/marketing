// Next.js calls this once per server runtime on boot. Optional — no-ops without a DSN, same as
// every other third-party integration in this codebase (mailer, S3, GA4).
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestError = async (...args: any[]) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  const captureRequestError = Sentry.captureRequestError as (...a: unknown[]) => void;
  captureRequestError(...args);
};
