import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCaseStudy } from '@/lib/api';
import { ArrowRightIcon } from '@/components/icons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);
  if (!cs) return {};
  return { title: cs.title, description: `${cs.client_name} — ${cs.client_industry}` };
}

export default async function CaseStudyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);
  if (!cs) notFound();

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[900px]">
        <Link href="/work" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All work
        </Link>

        {cs.is_featured && (
          <span className="mb-5 inline-block bg-accent px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-bg">
            Built &amp; owned by Anvil
          </span>
        )}
        <span className="block text-[11px] uppercase tracking-wider text-faint">{cs.client_industry}</span>
        <h1 className="mb-10 mt-3 font-serif text-4xl font-normal leading-tight md:text-[48px]">{cs.title}</h1>

        {cs.cover_image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden border border-line bg-bg2">
            <Image src={cs.cover_image} alt={cs.title} fill className="object-cover" sizes="900px" />
          </div>
        )}

        <div className="mb-14 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          {cs.results_json.map((r) => (
            <div key={r.metric} className="bg-bg p-6">
              <div className="font-serif-italic text-3xl text-accent">{r.value}</div>
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

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
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
          <Link href="/contact" className="inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg hover:opacity-90">
            Start a project like this <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
