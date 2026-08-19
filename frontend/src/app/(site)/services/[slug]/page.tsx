import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getService, getFaqs, getPublicSettings } from '@/lib/api';
import { ArrowRightIcon, SERVICE_ICONS } from '@/components/icons';
import { FaqAccordion } from '@/components/FaqAccordion';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.short_description,
    openGraph: { title: service.title, description: service.short_description },
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getService(slug), getPublicSettings()]);
  if (!service) notFound();

  const Icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.target;
  let faqs = await getFaqs(slug);
  if (!faqs.length) faqs = await getFaqs('general');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.short_description,
    provider: { '@type': 'Organization', name: settings.agency_name || 'Anvil Digital' },
  };

  const faqJsonLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: service.title, item: `${siteUrl}/services/${slug}` },
    ],
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-[1000px]">
        <Link href="/services" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All services
        </Link>

        <div className="icon-badge gold mb-6 h-16! w-16!">
          <Icon size={30} />
        </div>
        <h1 className="mb-5 font-serif text-4xl font-normal leading-tight md:text-[48px]">{service.title}</h1>
        <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted">{service.short_description}</p>

        {service.full_description && (
          <div className="mb-14 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-fg/90">
            {service.full_description}
          </div>
        )}

        {service.features_json?.length > 0 && (
          <div className="mb-14">
            <h2 className="mb-5 text-xs uppercase tracking-[0.2em] text-accent">What&apos;s included</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {service.features_json.map((f) => (
                <div key={f} className="flex items-start gap-3 rounded-lg border border-line-soft bg-bg2/50 px-4 py-3.5 text-[15px]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {service.related_case_studies?.length > 0 && (
          <div className="mb-14">
            <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-accent">Related case studies</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {service.related_case_studies.map((cs) => (
                <Link
                  key={cs.id}
                  href={`/work/${cs.slug}`}
                  className="glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/35"
                >
                  <h3 className="mb-4 text-lg font-semibold">{cs.title}</h3>
                  <div className="flex gap-6">
                    {cs.results_json.slice(0, 2).map((r) => (
                      <div key={r.metric}>
                        <div className="font-serif-italic text-accent text-xl">{r.value}</div>
                        <div className="text-xs text-faint">{r.metric}</div>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {faqs.length > 0 && (
          <div className="mb-14">
            <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Frequently asked</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}

        <Link
          href="/contact"
          className="group inline-flex items-center gap-2.5 bg-accent px-8 py-4 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-14px_var(--accent)]"
        >
          Talk to us about {service.title} <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </main>
  );
}
