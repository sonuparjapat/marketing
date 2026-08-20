import type { Metadata } from 'next';
import { getSubscriptionPlans } from '@/lib/api';
import { PricingCards } from '@/components/PricingCards';
import { ShieldCheckIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Premium',
  description: 'Unlock premium playbooks, guides and gated services with a plan built around what you actually need.',
  alternates: { canonical: '/premium' },
};

export default async function PremiumPage() {
  const plans = await getSubscriptionPlans();

  return (
    <main className="px-6 pb-24 pt-28 md:px-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-wide text-accent">
          <ShieldCheckIcon size={12} /> Premium
        </span>
        <h1 className="mt-5 font-serif text-4xl font-normal leading-tight md:text-5xl">Go beyond the free playbook</h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Every plan bundles a fixed set of premium services — decided upfront, never quietly changed once you&apos;re
          subscribed. Pick the duration that fits.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl">
        <PricingCards plans={plans} />
      </div>

      {!plans.length && (
        <p className="mx-auto mt-10 max-w-md text-center text-sm text-faint">
          No plans are available right now — check back soon.
        </p>
      )}
    </main>
  );
}
