import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCaseStudy, getPublicSettings } from '@/lib/api';
import { ArrowRightIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);
  if (!cs) return {};
  return {
    title: cs.title,
    description: `${cs.client_name} — ${cs.client_industry}`,
    alternates: { canonical: `/work/${slug}` },
  };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cs, settings] = await Promise.all([getCaseStudy(slug), getPublicSettings()]);
  if (!cs) notFound();
  const agencyName = settings.agency_name || 'Anvil';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Work', item: `${siteUrl}/work` },
      { '@type': 'ListItem', position: 3, name: cs.title, item: `${siteUrl}/work/${slug}` },
    ],
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-[900px]">
        <Link href="/work" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All work
        </Link>

        {cs.is_featured && (
          <span className="mb-5 inline-block rounded-full bg-gradient-to-r from-accent to-[oklch(0.68_0.15_60)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
            Built &amp; owned by {agencyName}
          </span>
        )}
        <span className="block text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
        <h1 className="mb-10 mt-3 font-serif text-4xl font-normal leading-tight md:text-[48px]">{cs.title}</h1>

        {cs.cover_image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-line-soft bg-bg2">
            <Image src={cs.cover_image} alt={cs.title} fill className="object-cover" sizes="900px" />
          </div>
        )}

        <div className="glass mb-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4">
          {cs.results_json.map((r) => (
            <div key={r.metric} className="bg-bg/40 p-6 transition-colors hover:bg-bg2/60">
              <div className="font-serif-italic grad-text text-3xl">{r.value}</div>
              <div className="mt-1 text-xs text-faint">{r.metric}{r.label ? `, ${r.label}` : ''}</div>
            </div>
          ))}
        </div>

        {cs.challenge && (
          <div className="mb-10">
            <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">The challenge</h2>
            <div
              className="max-w-2xl text-[15px] leading-relaxed text-fg/90 [&>p]:mb-3"
              dangerouslySetInnerHTML={{ __html: cs.challenge }}
            />
          </div>
        )}

        {cs.solution && (
          <div className="mb-14">
            <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">What we did</h2>
            <div
              className="max-w-2xl text-[15px] leading-relaxed text-fg/90 [&>p]:mb-3"
              dangerouslySetInnerHTML={{ __html: cs.solution }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line-soft pt-8">
          <div className="flex gap-6 text-sm">
            {cs.prev && (
              <Link href={`/work/${cs.prev.slug}`} className="text-muted hover:text-accent">
                &larr; {cs.prev.title}
              </Link>
            )}
            {cs.next && (
              <Link href={`/work/${cs.next.slug}`} className="text-muted hover:text-accent">
                {cs.next.title} &rarr;
              </Link>
            )}
          </div>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-14px_var(--accent)]"
          >
            Start a project like this <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </main>
  );
}
