'use client';

import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const { show } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await apiClient.post('/subscribe', { email });
      setStatus('done');
      setEmail('');
      show("You're subscribed — thank you.");
    } catch {
      setStatus('error');
      show('Something went wrong — please try again.', 'error');
    }
  };

  if (status === 'done') {
    return <p className="text-sm text-accent">You&apos;re subscribed — thank you.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 border border-line bg-bg2 px-3.5 py-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-accent px-4 py-3 text-sm font-bold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'loading' ? '...' : 'Join'}
      </button>
      {status === 'error' && <span className="sr-only">Something went wrong, please try again.</span>}
    </form>
  );
}
