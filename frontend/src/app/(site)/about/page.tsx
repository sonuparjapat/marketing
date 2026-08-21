import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTeam, getPage, getPublicSettings } from '@/lib/api';
import { ArrowRightIcon, LinkedinIcon } from '@/components/icons';

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
          <div className="mx-auto max-w-[1312px] 2xl:max-w-[1600px] min-[1920px]:max-w-[1880px]">
            <span className="text-xs uppercase tracking-[0.2em] text-accent">The team</span>
            <h2 className="mt-3 mb-14 font-serif text-3xl font-normal md:text-4xl">People, not a logo.</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              {team.map((member) => (
                <div key={member.id} className="glass group overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/35">
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-xl border border-line-soft bg-bg2">
                    {member.photo && (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="200px"
                      />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[15px] font-semibold">{member.name}</h3>
                      <p className="mb-2 text-[13px] text-muted">{member.designation}</p>
                    </div>
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-faint transition-colors hover:text-accent"
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <LinkedinIcon size={16} />
                      </a>
                    )}
                  </div>
                  {member.bio && <p className="text-[12.5px] leading-relaxed text-faint">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden px-6 py-24 text-center md:px-16">
        <div
          className="animate-drift pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent/20 to-[oklch(0.55_0.11_300_/_0.15)] blur-[120px]"
          aria-hidden="true"
        />
        <div className="glass glass-border-grad relative mx-auto max-w-[640px] rounded-2xl p-12 md:p-16">
          <h2 className="mb-8 font-serif text-3xl font-normal md:text-[38px]">Want the same treatment?</h2>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2.5 bg-accent px-8 py-4 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-14px_var(--accent)]"
          >
            Book a Free Strategy Call <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
