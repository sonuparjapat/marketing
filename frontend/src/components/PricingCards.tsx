'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionPlan } from '@/lib/api';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { useRazorpayCheckout } from '@/lib/useRazorpayCheckout';
import { useToast } from '@/components/Toast';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="shrink-0 text-accent">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function durationLabel(days: number) {
  if (days % 365 === 0) return `${days / 365} year${days / 365 > 1 ? 's' : ''}`;
  if (days % 30 === 0) return `${days / 30} month${days / 30 > 1 ? 's' : ''}`;
  return `${days} days`;
}

export function PricingCards({ plans }: { plans: SubscriptionPlan[] }) {
  const { customer, loading } = useCustomerAuth();
  const { show } = useToast();
  const router = useRouter();
  const [justSubscribed, setJustSubscribed] = useState<number | null>(null);

  const { subscribe, processing, error } = useRazorpayCheckout({
    onSuccess: () => {
      show("You're subscribed! Access is active now.");
      router.refresh();
    },
  });

  const onSubscribe = (plan: SubscriptionPlan) => {
    if (loading) return;
    if (!customer) {
      window.dispatchEvent(new Event('open-auth-drawer'));
      return;
    }
    setJustSubscribed(plan.id);
    subscribe(plan.id, customer.name, customer.email);
  };

  if (!plans.length) return null;

  return (
    <div>
      <div className={`grid gap-6 ${plans.length >= 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2' : 'max-w-sm mx-auto'}`}>
        {plans.map((plan, i) => {
          const featured = i === Math.floor((plans.length - 1) / 2) && plans.length > 1;
          return (
            <div
              key={plan.id}
              className={`glass relative flex flex-col rounded-2xl p-8 ${featured ? 'glass-border-grad ring-1 ring-accent/30' : ''}`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-bg">
                  Most popular
                </span>
              )}
              <h3 className="font-serif text-2xl">{plan.name}</h3>
              {plan.description && <p className="mt-2 text-sm leading-relaxed text-muted">{plan.description}</p>}
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="font-serif text-4xl">₹{(plan.price_paise / 100).toLocaleString('en-IN')}</span>
                <span className="text-sm text-faint">/ {durationLabel(plan.duration_days)}</span>
              </div>
              <ul className="mt-7 flex-1 space-y-3">
                {plan.services.map((s) => (
                  <li key={s.id} className="flex items-start gap-2.5 text-sm text-muted">
                    <CheckIcon />
                    {s.label}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSubscribe(plan)}
                disabled={processing && justSubscribed === plan.id}
                className={`mt-8 w-full py-3.5 text-sm font-bold transition-all disabled:opacity-60 ${
                  featured ? 'bg-accent text-bg hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)]' : 'border border-line-soft hover:border-accent hover:text-accent'
                }`}
              >
                {processing && justSubscribed === plan.id ? 'Processing…' : customer ? 'Subscribe' : 'Sign in to subscribe'}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
