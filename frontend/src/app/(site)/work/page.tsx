import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCaseStudies, getPublicSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Our Work',
  description: 'Case studies from brands we’ve grown — including the D2C brand we built and own ourselves.',
  alternates: { canonical: '/work' },
};

export default async function WorkPage() {
  const [caseStudies, settings] = await Promise.all([getCaseStudies(), getPublicSettings()]);
  const agencyName = settings.agency_name || 'Anvil';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Our Work',
    url: `${siteUrl}/work`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: caseStudies.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${siteUrl}/work/${c.slug}`,
        name: c.title,
      })),
    },
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[1312px]">
        <span className="text-xs uppercase tracking-[0.2em] text-accent">Selected work</span>
        <h1 className="mt-3 mb-16 max-w-2xl font-serif text-4xl font-normal leading-tight md:text-[50px]">
          Proof, not portfolios.
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {caseStudies.map((cs, i) => {
            const hue = (['85', '165', '25'] as const)[i % 3];
            return (
              <Link
                key={cs.id}
                href={`/work/${cs.slug}`}
                className="group glass block overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/35 hover:shadow-[0_36px_64px_-28px_rgba(0,0,0,0.7)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden border-b border-line-soft bg-bg2">
                  {cs.cover_image ? (
                    <Image
                      src={cs.cover_image}
                      alt={cs.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="600px"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      style={{
                        background: `radial-gradient(120% 100% at 15% 10%, oklch(0.42 0.09 ${hue} / 0.9), transparent 60%), radial-gradient(90% 80% at 90% 90%, oklch(0.55 0.11 300 / 0.5), transparent 60%), linear-gradient(150deg, oklch(0.22 0.04 ${hue}), oklch(0.16 0.028 265))`,
                      }}
                    >
                      <svg className="blog-chart" viewBox="0 0 200 90" preserveAspectRatio="none">
                        <path
                          d="M0,55 L28,48 L56,50 L84,32 L112,38 L140,20 L168,26 L200,10"
                          fill="none"
                          stroke="oklch(1 0 0 / 0.5)"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  {cs.is_featured && (
                    <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-accent to-[oklch(0.68_0.15_60)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
                      Built &amp; owned by {agencyName}
                    </span>
                  )}
                  <span className="block text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
                  <h2 className="mb-5 mt-3 text-xl font-semibold transition-colors group-hover:text-accent">{cs.title}</h2>
                  <div className="flex gap-6">
                    {cs.results_json.slice(0, 3).map((r) => (
                      <div key={r.metric}>
                        <div className="font-serif-italic grad-text text-2xl">{r.value}</div>
                        <div className="text-xs text-faint">{r.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!caseStudies.length && <p className="text-sm text-faint">Case studies will appear here once published.</p>}
      </div>
    </main>
  );
}
