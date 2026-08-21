'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/cookieConsent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value: 'accepted' | 'declined') => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-line-soft bg-bg2/95 px-6 py-5 backdrop-blur-md md:px-10">
      <div className="mx-auto flex max-w-[1312px] 2xl:max-w-[1600px] min-[1920px]:max-w-[1880px] flex-col items-center justify-between gap-4 md:flex-row">
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted">
          We use cookies for basic analytics (Google Analytics) to understand how visitors use this site. No data is
          sold or used for third-party advertising. Read our{' '}
          <a href="/privacy-policy" className="text-accent hover:opacity-80">
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => choose('declined')}
            className="rounded-lg border border-line-soft px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Decline
          </button>
          <button
            onClick={() => choose('accepted')}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
