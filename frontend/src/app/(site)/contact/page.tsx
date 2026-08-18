import type { Metadata } from 'next';
import { getPublicSettings, getServices } from '@/lib/api';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get a free marketing audit from Anvil — a performance agency that's shipped its own D2C brand.",
};

export default async function ContactPage() {
  const [settings, services] = await Promise.all([getPublicSettings(), getServices()]);
  const budgets: string[] = settings.budget_ranges ? JSON.parse(settings.budget_ranges) : [];

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto grid max-w-[1312px] gap-16 md:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-accent">Get in touch</span>
          <h1 className="mt-3 mb-6 font-serif text-4xl font-normal leading-tight md:text-[46px]">
            Let&apos;s talk growth.
          </h1>
          <p className="mb-10 max-w-md text-[15px] leading-relaxed text-muted">
            30 minutes, no deck — just a straight look at what&apos;s leaking in your funnel. Tell us about your
            brand and we&apos;ll get back within 24 hours.
          </p>

          <div className="space-y-5 border-t border-line pt-8 text-sm">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-faint">Email</div>
              <div>{settings.email || 'hello@anvil.agency'}</div>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-faint">Phone</div>
              <div>{settings.phone || '+91 98XXX XXXXX'}</div>
            </div>
            {settings.address && (
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-faint">Office</div>
                <div>{settings.address}</div>
              </div>
            )}
          </div>
        </div>

        <ContactForm services={services.map((s) => s.title)} budgets={budgets} />
      </div>
    </main>
  );
}
