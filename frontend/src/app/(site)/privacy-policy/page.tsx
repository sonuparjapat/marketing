import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage, getPublicSettings } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('privacy-policy');
  return {
    title: page?.meta_title || page?.title || 'Privacy Policy',
    description: page?.meta_description || undefined,
    alternates: { canonical: '/privacy-policy' },
  };
}

export default async function PrivacyPolicyPage() {
  const [page, settings] = await Promise.all([getPage('privacy-policy'), getPublicSettings()]);
  if (!page) notFound();

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-10 font-serif text-4xl font-normal">{page.title}</h1>
        <div
          className="space-y-5 text-[15px] leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-fg [&_h2]:text-lg [&_h2]:font-semibold"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        {(settings.agency_legal_name || settings.privacy_contact_email) && (
          <div className="mt-12 border-t border-line pt-6 text-sm text-faint">
            {settings.agency_legal_name && <p>Registered as {settings.agency_legal_name}.</p>}
            {settings.privacy_contact_email && (
              <p className="mt-1">
                Questions about this policy? Contact us at{' '}
                <a href={`mailto:${settings.privacy_contact_email}`} className="text-accent hover:opacity-80">
                  {settings.privacy_contact_email}
                </a>
                .
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
