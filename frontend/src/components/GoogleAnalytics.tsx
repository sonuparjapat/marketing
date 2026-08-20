'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getConsent, COOKIE_CONSENT_EVENT, type ConsentValue } from '@/lib/cookieConsent';

// Loads the GA4 scripts only after the visitor has accepted cookies — never unconditionally, since
// analytics cookies require consent under GDPR / India's DPDP Act. Reacts live to the banner's
// choice without a page reload via the cookieconsent-change event.
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(getConsent() === 'accepted');
    const onChange = (e: Event) => {
      const value = (e as CustomEvent<ConsentValue>).detail;
      setConsented(value === 'accepted');
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!consented || !gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
