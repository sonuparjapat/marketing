'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';
import { AuthDrawer } from '@/components/AuthDrawer';

type VoteType = 'like' | 'dislike';

export function PostVoteButtons({
  slug,
  initialLikeCount,
  initialDislikeCount,
}: {
  slug: string;
  initialLikeCount: number;
  initialDislikeCount: number;
}) {
  const { customer } = useCustomerAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [myVote, setMyVote] = useState<VoteType | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!customer) {
      setMyVote(null);
      return;
    }
    customerApiClient
      .get(`/posts/${slug}/my-vote`)
      .then((res) => setMyVote(res.data.data.vote_type))
      .catch(() => {});
  }, [customer, slug]);

  const vote = async (voteType: VoteType) => {
    if (!customer) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await customerApiClient.post(`/posts/${slug}/vote`, { vote_type: voteType });
      setLikeCount(res.data.data.like_count);
      setDislikeCount(res.data.data.dislike_count);
      setMyVote(res.data.data.my_vote);
    } catch {
      // best-effort — counts just stay as they were
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => vote('like')}
        aria-pressed={myVote === 'like'}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
          myVote === 'like' ? 'border-accent bg-accent/10 text-accent' : 'border-line-soft text-muted hover:border-accent hover:text-accent'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={myVote === 'like' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
          <path d="M7 22V11M2 13v7a2 2 0 002 2h12.5a2 2 0 002-1.6l1.4-7A2 2 0 0018 11h-5.5l1-5A2 2 0 0011.6 4L7 11" />
        </svg>
        {likeCount}
      </button>
      <button
        onClick={() => vote('dislike')}
        aria-pressed={myVote === 'dislike'}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
          myVote === 'dislike' ? 'border-red-400/60 bg-red-400/10 text-red-400' : 'border-line-soft text-muted hover:border-red-400/50 hover:text-red-400'
        }`}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={myVote === 'dislike' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.8}
          style={{ transform: 'rotate(180deg)' }}
        >
          <path d="M7 22V11M2 13v7a2 2 0 002 2h12.5a2 2 0 002-1.6l1.4-7A2 2 0 0018 11h-5.5l1-5A2 2 0 0011.6 4L7 11" />
        </svg>
        {dislikeCount}
      </button>
      <AuthDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
