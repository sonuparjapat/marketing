'use client';

import { useState } from 'react';
import type { PostComment } from '@/lib/api';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';
import { AuthDrawer } from '@/components/AuthDrawer';

export function CommentSection({ slug, initialComments }: { slug: string; initialComments: PostComment[] }) {
  const { customer } = useCustomerAuth();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const onSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await customerApiClient.post(`/comments/${slug}`, { content });
      setComments((prev) => [...prev, { ...res.data.data, customer_name: customer?.name || 'You' }]);
      setContent('');
    } catch {
      // best-effort — the section just doesn't gain a new comment on failure
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-[720px] border-t border-line-soft pt-10">
      <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-accent">
        {comments.length ? `${comments.length} comment${comments.length === 1 ? '' : 's'}` : 'Comments'}
      </h2>

      <div className="mb-8 space-y-5">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-line-soft bg-bg2/40 p-5">
            <div className="mb-1.5 flex items-center gap-2 text-xs text-faint">
              <span className="font-semibold text-fg">{c.customer_name}</span>
              <span>&middot;</span>
              <span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <p className="text-[14.5px] leading-relaxed text-muted">{c.content}</p>
          </div>
        ))}
        {!comments.length && <p className="text-sm text-faint">Be the first to comment.</p>}
      </div>

      {customer ? (
        <div className="flex gap-3">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <button
            onClick={onSubmit}
            disabled={submitting || !content.trim()}
            className="shrink-0 self-start rounded-lg bg-accent px-5 py-3 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          className="rounded-lg border border-line-soft px-5 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Sign in to comment
        </button>
      )}
      <AuthDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
