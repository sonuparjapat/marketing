'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';
import { extractHeadings, type Heading } from '@/lib/toc';
import { highlightCodeBlocks } from '@/lib/highlightCode';
import { LockIcon, ArrowRightIcon } from '@/components/icons';

// Companion to the server-rendered blog detail page: the page always fetches server-side (no
// access to the visitor's Bearer token, which lives in browser localStorage), so a premium post
// always comes back `locked: true` there regardless of who's actually asking. Once mounted in the
// browser, useCustomerAuth() knows who's signed in, so this re-checks entitlement client-side and
// swaps in the real content if the visitor has access — mirrors the existing "did I already vote"
// client re-check pattern (getMyPostVote/PostVoteButtons).
export function PremiumContent({ slug, excerpt, serviceLabel }: { slug: string; excerpt: string; serviceLabel: string | null }) {
  const { customer, loading } = useCustomerAuth();
  const [state, setState] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [html, setHtml] = useState('');
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!customer) {
      setState('locked');
      return;
    }
    customerApiClient
      .get(`/posts/${slug}/full-content`)
      .then((res) => {
        const content: string = res.data.data.content;
        const { html: withIds, headings: h } = extractHeadings(content);
        setHtml(highlightCodeBlocks(withIds));
        setHeadings(h);
        setState('unlocked');
      })
      .catch(() => setState('locked'));
  }, [loading, customer, slug]);

  if (state === 'checking') {
    return <div className="py-20 text-center text-sm text-faint">Checking your access…</div>;
  }

  if (state === 'unlocked') {
    return (
      <>
        {headings.length > 1 && (
          <nav className="mb-10 rounded-xl border border-line-soft bg-bg2/40 p-5 text-[13px]">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">On this page</div>
            <div className="space-y-2">
              {headings.map((h) => (
                <a key={h.id} href={`#${h.id}`} className={`block text-muted hover:text-accent ${h.level === 3 ? 'pl-3' : ''}`}>
                  {h.text}
                </a>
              ))}
            </div>
          </nav>
        )}
        <div
          className="prose prose-lg max-w-none [&_pre]:bg-bg2 [&_img]:border [&_img]:border-line"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </>
    );
  }

  return (
    <div className="glass glass-border-grad rounded-2xl p-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
        <LockIcon size={26} className="text-accent" />
      </div>
      <h3 className="mb-3 font-serif text-2xl">This is a premium post</h3>
      <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-muted">
        {excerpt}
        {serviceLabel && (
          <>
            {' '}
            Unlock it with a plan that includes <span className="text-fg">{serviceLabel}</span>.
          </>
        )}
      </p>
      <Link
        href="/premium"
        className="group inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)]"
      >
        View plans <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
