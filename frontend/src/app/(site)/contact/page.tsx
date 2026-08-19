import type { Metadata } from 'next';
import { getPublicSettings, getServices } from '@/lib/api';
import { ContactForm } from '@/components/ContactForm';
import { RequestCallbackButton } from '@/components/RequestCallbackButton';

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get a free marketing audit from Anvil — a performance agency that's shipped its own D2C brand.",
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const [settings, services] = await Promise.all([getPublicSettings(), getServices()]);
  let budgets: string[] = [];
  if (settings.budget_ranges) {
    try {
      const parsed = JSON.parse(settings.budget_ranges);
      if (Array.isArray(parsed)) budgets = parsed;
    } catch {
      // Malformed setting — fall back to no budget options rather than crashing the page.
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${settings.agency_name || 'Anvil'}`,
    url: `${siteUrl}/contact`,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact` },
    ],
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="relative mx-auto grid max-w-[1312px] gap-16 md:grid-cols-[1fr_1.3fr]">
        <div
          className="animate-drift pointer-events-none absolute -left-24 -top-16 h-[360px] w-[360px] rounded-full bg-accent/10 blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="text-xs uppercase tracking-[0.2em] text-accent">Get in touch</span>
          <h1 className="mt-3 mb-6 font-serif text-4xl font-normal leading-tight md:text-[46px]">
            Let&apos;s talk <span className="font-serif-italic text-accent">growth</span>.
          </h1>
          <p className="mb-10 max-w-md text-[15px] leading-relaxed text-muted">
            30 minutes, no deck — just a straight look at what&apos;s leaking in your funnel. Tell us about your
            brand and we&apos;ll get back within 24 hours.
          </p>

          <div className="glass space-y-5 rounded-2xl p-7 text-sm">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-faint">Email</div>
              <div>{settings.email || 'hello@anvil.agency'}</div>
            </div>
            <div className="border-t border-line-soft pt-5">
              <div className="mb-1 text-xs uppercase tracking-wide text-faint">Phone</div>
              <div>{settings.phone || '+91 98XXX XXXXX'}</div>
            </div>
            {settings.address && (
              <div className="border-t border-line-soft pt-5">
                <div className="mb-1 text-xs uppercase tracking-wide text-faint">Office</div>
                <div>{settings.address}</div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <RequestCallbackButton />
          </div>
        </div>

        <div className="glass glass-border-grad relative rounded-2xl p-8 md:p-10">
          <ContactForm services={services.map((s) => s.title)} budgets={budgets} />
        </div>
      </div>
    </main>
  );
}
