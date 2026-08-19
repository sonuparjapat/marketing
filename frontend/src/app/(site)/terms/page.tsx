import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage, getPublicSettings } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('terms');
  return {
    title: page?.meta_title || page?.title || 'Terms of Service',
    description: page?.meta_description || undefined,
    alternates: { canonical: '/terms' },
  };
}

export default async function TermsPage() {
  const [page, settings] = await Promise.all([getPage('terms'), getPublicSettings()]);
  if (!page) notFound();

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-10 font-serif text-4xl font-normal">{page.title}</h1>
        <div
          className="space-y-5 text-[15px] leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-fg [&_h2]:text-lg [&_h2]:font-semibold"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        {(settings.agency_legal_name || settings.notice_period) && (
          <div className="mt-12 border-t border-line pt-6 text-sm text-faint">
            {settings.agency_legal_name && <p>These terms are entered into with {settings.agency_legal_name}.</p>}
            {settings.notice_period && <p className="mt-1">Notice period for cancellation: {settings.notice_period}.</p>}
          </div>
        )}
      </div>
    </main>
  );
}
