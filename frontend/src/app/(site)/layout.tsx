import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { PageViewTracker } from '@/components/PageViewTracker';
import { getPublicSettings, getNavLinks } from '@/lib/api';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([getPublicSettings(), getNavLinks()]);

  return (
    <>
      <PageViewTracker />
      <Header agencyName={settings.agency_name} navLinks={nav.header} />
      {children}
      <Footer settings={settings} navLinks={nav.footer} />
      <WhatsAppFloat number={settings.whatsapp_number} />
    </>
  );
}
