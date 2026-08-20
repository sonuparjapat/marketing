'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PostComment } from '@/lib/api';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';
import { AuthDrawer } from '@/components/AuthDrawer';

type VoteType = 'like' | 'dislike';

const AVATAR_HUES = ['gold', 'emerald', 'coral'] as const;
function avatarHue(name: string) {
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_HUES[sum % 3];
}

function Avatar({ name }: { name: string }) {
  const hue = avatarHue(name);
  return (
    <div className={`icon-badge ${hue} h-8! w-8! shrink-0 rounded-full! text-[11px] font-bold`}>{name.charAt(0).toUpperCase()}</div>
  );
}

function VoteButtons({ comment, onVoted }: { comment: PostComment; onVoted: (c: PostComment) => void }) {
  const { customer } = useCustomerAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const vote = async (voteType: VoteType) => {
    if (!customer) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await customerApiClient.post(`/comments/comment/${comment.id}/vote`, { vote_type: voteType });
      onVoted({ ...comment, like_count: res.data.data.like_count, dislike_count: res.data.data.dislike_count, my_vote: res.data.data.my_vote });
    } catch {
      // best-effort
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <button
        onClick={() => vote('like')}
        className={`flex items-center gap-1 transition-colors ${comment.my_vote === 'like' ? 'text-accent' : 'text-faint hover:text-accent'}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={comment.my_vote === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
          <path d="M7 22V11M2 13v7a2 2 0 002 2h12.5a2 2 0 002-1.6l1.4-7A2 2 0 0018 11h-5.5l1-5A2 2 0 0011.6 4L7 11" />
        </svg>
        {comment.like_count > 0 && comment.like_count}
      </button>
      <button
        onClick={() => vote('dislike')}
        className={`flex items-center gap-1 transition-colors ${comment.my_vote === 'dislike' ? 'text-red-400' : 'text-faint hover:text-red-400'}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={comment.my_vote === 'dislike' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          style={{ transform: 'rotate(180deg)' }}
        >
          <path d="M7 22V11M2 13v7a2 2 0 002 2h12.5a2 2 0 002-1.6l1.4-7A2 2 0 0018 11h-5.5l1-5A2 2 0 0011.6 4L7 11" />
        </svg>
        {comment.dislike_count > 0 && comment.dislike_count}
      </button>
      <AuthDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, 'y'], [2592000, 'mo'], [86400, 'd'], [3600, 'h'], [60, 'm'],
  ];
  for (const [secs, label] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n}${label} ago`;
  }
  return 'just now';
}

function CommentLine({
  comment,
  onVoted,
  onReply,
}: {
  comment: PostComment;
  onVoted: (c: PostComment) => void;
  onReply: (comment: PostComment) => void;
}) {
  return (
    <div className="flex gap-3">
      <Avatar name={comment.customer_name} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-fg">{comment.customer_name}</span>
          <span className="text-[11px] text-faint">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-[14px] leading-relaxed text-muted">
          {comment.reply_to_name && <span className="mr-1 font-medium text-accent">@{comment.reply_to_name}</span>}
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <VoteButtons comment={comment} onVoted={onVoted} />
          <button onClick={() => onReply(comment)} className="text-xs text-faint hover:text-accent">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

function Thread({
  comment,
  replies,
  onVoted,
  onReply,
}: {
  comment: PostComment;
  replies: PostComment[];
  onVoted: (c: PostComment) => void;
  onReply: (comment: PostComment) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <CommentLine comment={comment} onVoted={onVoted} onReply={onReply} />

      {replies.length > 0 && (
        <div className="ml-11 mt-3">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 text-xs font-medium text-accent hover:opacity-80"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7 10l5 5 5-5" />
              </svg>
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-2 text-xs font-medium text-accent hover:opacity-80"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 14l5-5 5 5" />
                </svg>
                Hide replies
              </button>
              {replies.map((r) => (
                <CommentLine key={r.id} comment={r} onVoted={onVoted} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ slug, initialComments }: { slug: string; initialComments: PostComment[] }) {
  const { customer } = useCustomerAuth();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  // The initial (server-rendered) list can never know "did I already vote" — the customer's token
  // lives in browser localStorage, never forwarded to a server-side fetch — so once we know someone
  // is signed in, quietly re-fetch the authenticated version to pick up accurate my_vote state.
  useEffect(() => {
    if (!customer) return;
    customerApiClient
      .get(`/comments/${slug}`)
      .then((res) => setComments(res.data.data))
      .catch(() => {});
  }, [customer, slug]);

  const topLevel = useMemo(() => comments.filter((c) => !c.parent_id), [comments]);
  const repliesOf = (id: number) => comments.filter((c) => c.parent_id === id);

  const onVoted = (updated: PostComment) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const onSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await customerApiClient.post(`/comments/${slug}`, { content, parent_id: replyTo?.id ?? null });
      setComments((prev) => [
        ...prev,
        { ...res.data.data, customer_name: customer?.name || 'You', like_count: 0, dislike_count: 0, my_vote: null },
      ]);
      setContent('');
      setReplyTo(null);
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

      {customer ? (
        <div className="mb-10 flex gap-3">
          <Avatar name={customer.name} />
          <div className="flex-1">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 text-xs text-faint">
                Replying to <span className="font-medium text-accent">@{replyTo.customer_name}</span>
                <button onClick={() => setReplyTo(null)} className="text-accent hover:opacity-80">
                  Cancel
                </button>
              </div>
            )}
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
              className="w-full resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={onSubmit}
                disabled={submitting || !content.trim()}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'Posting…' : replyTo ? 'Reply' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAuthOpen(true)}
          className="mb-10 rounded-lg border border-line-soft px-5 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Sign in to comment
        </button>
      )}

      <div className="space-y-7">
        {topLevel.map((c) => (
          <Thread key={c.id} comment={c} replies={repliesOf(c.id)} onVoted={onVoted} onReply={setReplyTo} />
        ))}
        {!topLevel.length && <p className="text-sm text-faint">Be the first to comment.</p>}
      </div>

      <AuthDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
