'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';

type Ticket = { id: number; subject: string; status: string; updated_at: string };

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function SupportTicketsPage() {
  const { customer, loading } = useCustomerAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer) return;
    customerApiClient
      .get('/support/tickets')
      .then((res) => setTickets(res.data.data))
      .finally(() => setLoadingTickets(false));
  }, [customer]);

  const onCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await customerApiClient.post('/support/tickets', { subject, message });
      setTickets((prev) => [{ id: res.data.data.id, subject: res.data.data.subject, status: res.data.data.status, updated_at: res.data.data.created_at }, ...prev]);
      setCreating(false);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(errMessage(err, 'Could not open the ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (!customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-muted">Sign in from the account icon in the navbar to view your tickets.</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[640px]">
        <Link href="/account" className="mb-6 inline-block text-sm text-muted hover:text-accent">
          &larr; Account
        </Link>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-normal">Support tickets</h1>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5"
            >
              New ticket
            </button>
          )}
        </div>

        {creating && (
          <div className="glass mb-8 space-y-4 rounded-2xl p-7">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="w-full resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={onCreate}
                disabled={submitting || !subject.trim() || !message.trim()}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
              >
                {submitting ? 'Opening…' : 'Open ticket'}
              </button>
              <button onClick={() => setCreating(false)} className="text-sm text-muted hover:text-fg">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loadingTickets ? null : !tickets.length ? (
          <p className="text-sm text-faint">No tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/account/support/${t.id}`}
                className="glass flex items-center justify-between rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:border-accent/35"
              >
                <div>
                  <div className="font-semibold">{t.subject}</div>
                  <div className="text-xs text-faint">{new Date(t.updated_at).toLocaleString()}</div>
                </div>
                <span className="text-xs capitalize text-accent">{t.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
