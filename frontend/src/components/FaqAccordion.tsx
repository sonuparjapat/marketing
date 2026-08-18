'use client';

import { useState } from 'react';
import type { Faq } from '@/lib/api';

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  if (!faqs.length) return null;

  return (
    <div className="border-t border-line">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div key={faq.id} className="border-b border-line">
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="flex w-full items-center justify-between py-5 text-left text-[15px] font-semibold"
              aria-expanded={isOpen}
            >
              {faq.question}
              <span className={`ml-4 shrink-0 text-accent transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
            </button>
            {isOpen && <p className="mb-5 max-w-2xl text-[14.5px] leading-relaxed text-muted">{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
