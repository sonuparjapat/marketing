import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDoc } from '@/lib/api';
import { extractHeadings } from '@/lib/toc';

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const doc = await getDoc(type);
  return {
    title: doc?.title || 'Documentation',
    robots: { index: false, follow: false },
  };
}

export default async function PublicDocPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const doc = await getDoc(type);
  if (!doc) notFound();

  const { html, headings } = extractHeadings(doc.content);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Shared documentation</p>
        <h1 className="font-serif text-3xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-faint">Last updated {new Date(doc.updated_at).toLocaleDateString()}</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
        <div
          className="prose max-w-none border border-line bg-bg2 px-8 py-8"
          dangerouslySetInnerHTML={{ __html: html || '<p class="text-faint">Nothing written yet.</p>' }}
        />
        {headings.length > 1 && (
          <aside className="hidden lg:block">
            <div className="sticky top-8 border-l border-line pl-6">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">On this page</div>
              <nav className="space-y-2.5 text-[13px]">
                {headings.map((h) => (
                  <a key={h.id} href={`#${h.id}`} className={`block text-muted hover:text-accent ${h.level === 3 ? 'pl-3' : ''}`}>
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
