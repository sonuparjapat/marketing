'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';

type Message = { id: number; sender_type: 'customer' | 'admin'; message: string; created_at: string };
type TicketDetail = { id: number; subject: string; status: string; messages: Message[] };

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { customer, loading } = useCustomerAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    customerApiClient.get(`/support/tickets/${id}`).then((res) => setTicket(res.data.data));
  };

  useEffect(() => {
    if (!customer) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await customerApiClient.post(`/support/tickets/${id}/messages`, { message: reply });
      setReply('');
      load();
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  if (!customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-muted">Sign in from the account icon in the navbar to view this ticket.</p>
      </main>
    );
  }

  if (!ticket) return null;

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[640px]">
        <Link href="/account/support" className="mb-6 inline-block text-sm text-muted hover:text-accent">
          &larr; All tickets
        </Link>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-normal">{ticket.subject}</h1>
          <span className="text-xs capitalize text-accent">{ticket.status.replace('_', ' ')}</span>
        </div>

        <div className="mb-8 space-y-3">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl border p-4 text-sm ${
                m.sender_type === 'customer' ? 'ml-auto border-accent/30 bg-accent/5' : 'border-line-soft bg-bg2/40'
              }`}
            >
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-faint">
                {m.sender_type === 'customer' ? 'You' : 'Support'} &middot; {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="text-fg/90">{m.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== 'closed' ? (
          <div className="flex gap-3">
            <textarea
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              className="flex-1 resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="shrink-0 self-start rounded-lg bg-accent px-5 py-3 text-sm font-bold text-bg disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Reply'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-faint">This ticket is closed.</p>
        )}
      </div>
    </main>
  );
}
