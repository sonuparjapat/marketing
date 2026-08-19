import type { Metadata } from 'next';
import Link from 'next/link';
import { getServices } from '@/lib/api';
import { ArrowRightIcon, SERVICE_ICONS } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Six disciplines, one accountable team — performance marketing, SEO, brand, D2C websites, automation and social.',
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const services = await getServices();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Services',
    url: `${siteUrl}/services`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: services.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/services/${s.slug}`,
        name: s.title,
      })),
    },
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[1312px]">
        <span className="text-xs uppercase tracking-[0.2em] text-accent">What we do</span>
        <h1 className="mt-3 mb-6 max-w-2xl font-serif text-4xl font-normal leading-tight md:text-[50px]">
          Full-funnel growth, run by people who&apos;ve shipped.
        </h1>
        <p className="mb-16 max-w-lg text-[15px] leading-relaxed text-muted">
          Six disciplines. One accountable team. No hand-offs between &ldquo;the agency&rdquo; and &ldquo;the growth
          team&rdquo; — it&apos;s the same people.
        </p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.target;
            const hue = (['gold', 'emerald', 'coral'] as const)[i % 3];
            return (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group glass relative block overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_36px_64px_-28px_rgba(0,0,0,0.7)]"
              >
                <span className="font-serif-italic absolute right-6 top-6 text-[13px] text-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className={`icon-badge ${hue}`}>
                  <Icon size={22} />
                </div>
                <h2 className="mb-2.5 mt-5 text-xl font-semibold">{service.title}</h2>
                <p className="mb-5 text-[14.5px] leading-relaxed text-muted">{service.short_description}</p>
                <span className="inline-flex items-center gap-2 text-sm text-accent">
                  Learn more <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        {!services.length && (
          <p className="text-sm text-faint">Services will appear here once published from the admin panel.</p>
        )}
      </div>
    </main>
  );
}
