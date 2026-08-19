import type { Metadata } from 'next';
import { Newsreader, Manrope } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { getPublicSettings } from '@/lib/api';
import { ToastProvider } from '@/components/Toast';

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '500'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const title = settings.default_meta_title || "Anvil Digital — We don't just market brands. We've built one.";
  const agencyName = settings.agency_name || 'Anvil Digital';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: title, template: `%s | ${agencyName}` },
    description:
      settings.default_meta_description ||
      'A performance marketing agency for D2C & SME brands in India, built by people who have shipped their own eCommerce brand.',
    alternates: { canonical: '/' },
  };
}

// Only allow safe CSS color syntax through into the injected <style> tag (hex, oklch(), rgb(), named colors).
const SAFE_CSS_COLOR = /^[#a-zA-Z0-9(),.\s%-]{1,80}$/;
function safeColor(value: string | undefined, fallback: string) {
  return value && SAFE_CSS_COLOR.test(value) ? value : fallback;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();
  const gaId = settings.ga_measurement_id;
  const bg = safeColor(settings.primary_color, '#14171f');
  const accent = safeColor(settings.accent_color, '#d4af6a');

  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${manrope.variable} antialiased`}>
        <style>{`:root { --bg: ${bg}; --accent: ${accent}; }`}</style>
        <ToastProvider>{children}</ToastProvider>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
