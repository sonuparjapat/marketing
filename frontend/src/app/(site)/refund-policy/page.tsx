import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('refund-policy');
  return { title: page?.meta_title || page?.title || 'Refund Policy', description: page?.meta_description || undefined };
}

export default async function RefundPolicyPage() {
  const page = await getPage('refund-policy');
  if (!page) notFound();

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-10 font-serif text-4xl font-normal">{page.title}</h1>
        <div
          className="space-y-5 text-[15px] leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-fg [&_h2]:text-lg [&_h2]:font-semibold"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </main>
  );
}
