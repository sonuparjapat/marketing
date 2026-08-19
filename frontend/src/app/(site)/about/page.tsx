import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTeam, getPage, getPublicSettings } from '@/lib/api';
import { ArrowRightIcon } from '@/components/icons';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return {
    title: page?.meta_title || 'About',
    description: page?.meta_description || "A performance marketing agency that's built and shipped its own D2C brand — not just campaigns for others.",
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const [team, page, settings] = await Promise.all([getTeam(), getPage('about'), getPublicSettings()]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${settings.agency_name || 'Anvil'}`,
    url: `${siteUrl}/about`,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${siteUrl}/about` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <section className="border-b border-line px-6 py-24 md:px-16">
        <div className="mx-auto max-w-[900px]">
          <span className="text-xs uppercase tracking-[0.2em] text-accent">About {settings.agency_name || 'Anvil'}</span>
          <div
            className="mt-8 max-w-2xl space-y-6 text-[16px] leading-relaxed text-muted [&>p:first-child]:font-serif [&>p:first-child]:text-3xl [&>p:first-child]:leading-tight [&>p:first-child]:text-fg md:[&>p:first-child]:text-[42px]"
            dangerouslySetInnerHTML={{ __html: page?.content || '' }}
          />
        </div>
      </section>

      {team.length > 0 && (
        <section className="border-b border-line px-6 py-24 md:px-16">
          <div className="mx-auto max-w-[1312px]">
            <span className="text-xs uppercase tracking-[0.2em] text-accent">The team</span>
            <h2 className="mt-3 mb-14 font-serif text-3xl font-normal md:text-4xl">People, not a logo.</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
              {team.map((member) => (
                <div key={member.id}>
                  <div className="relative mb-4 aspect-square overflow-hidden border border-line bg-bg2">
                    {member.photo && (
                      <Image src={member.photo} alt={member.name} fill className="object-cover" sizes="200px" />
                    )}
                  </div>
                  <h3 className="text-[15px] font-semibold">{member.name}</h3>
                  <p className="mb-2 text-[13px] text-muted">{member.designation}</p>
                  {member.bio && <p className="text-[12.5px] leading-relaxed text-faint">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-24 text-center md:px-16">
        <h2 className="mb-8 font-serif text-3xl font-normal md:text-[38px]">Want the same treatment?</h2>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2.5 bg-accent px-8 py-4 text-sm font-bold text-bg transition-opacity hover:opacity-90"
        >
          Book a Free Strategy Call <ArrowRightIcon size={16} />
        </Link>
      </section>
    </main>
  );
}
