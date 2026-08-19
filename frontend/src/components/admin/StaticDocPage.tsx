'use client';

import { extractHeadings } from '@/lib/toc';

export function StaticDocPage({
  title,
  subtitle,
  contentHtml,
}: {
  title: string;
  subtitle: string;
  contentHtml: string;
}) {
  const { html, headings } = extractHeadings(contentHtml);

  return (
    <div className="-m-8 flex min-h-screen">
      <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-line bg-bg2 p-5">
        <div className="mb-6 px-1">
          <p className="font-serif-italic text-lg">{title}</p>
          <p className="mt-1 text-xs text-faint">Anvil Digital</p>
        </div>
        <nav className="space-y-0.5">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={`block rounded-sm px-3 py-1.5 text-xs text-muted hover:bg-bg hover:text-accent ${h.level === 3 ? 'pl-6 text-faint' : ''}`}
            >
              {h.text}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 w-full border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent"
        >
          Print / Save PDF
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="mb-10 border border-line bg-bg2 p-8">
          <h1 className="font-serif text-2xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
        </div>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  );
}
