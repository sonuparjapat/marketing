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
          {caseStudies.map((cs) => (
            <Link key={cs.id} href={`/work/${cs.slug}`} className="block border border-line transition-colors hover:border-faint">
              {cs.cover_image && (
                <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-bg2">
                  <Image src={cs.cover_image} alt={cs.title} fill className="object-cover" sizes="600px" />
                </div>
              )}
              <div className="p-8">
                {cs.is_featured && (
                  <span className="mb-4 inline-block bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
                    Built &amp; owned by {agencyName}
                  </span>
                )}
                <span className="block text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
                <h2 className="mb-5 mt-3 text-xl font-semibold">{cs.title}</h2>
                <div className="flex gap-6">
                  {cs.results_json.slice(0, 3).map((r) => (
                    <div key={r.metric}>
                      <div className="font-serif-italic text-2xl text-accent">{r.value}</div>
                      <div className="text-xs text-faint">{r.metric}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!caseStudies.length && <p className="text-sm text-faint">Case studies will appear here once published.</p>}
      </div>
    </main>
  );
}
