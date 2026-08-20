'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionInfo } from '@/components/admin/SectionInfo';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

type Ticket = {
  id: number;
  subject: string;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  updated_at: string;
};

type TicketMessage = {
  id: number;
  sender_type: 'customer' | 'admin';
  message: string;
  created_at: string;
};

type TicketDetail = Ticket & { messages: TicketMessage[] };

export default function AdminSupportTicketsPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('support_tickets.update');
  const { show } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [active, setActive] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/support-tickets', {
        params: { limit: 100, status: statusFilter || undefined },
      });
      setTickets(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openTicket = async (ticket: Ticket) => {
    const res = await apiClient.get(`/admin/support-tickets/${ticket.id}`);
    setActive(res.data.data);
    setReply('');
  };

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/admin/support-tickets/${active.id}/messages`, { message: reply });
      setActive((prev) => (prev ? { ...prev, messages: [...prev.messages, res.data.data], status: 'in_progress' } : prev));
      setReply('');
      load();
      show('Reply sent — the customer has been emailed.');
    } catch {
      show('Something went wrong.', 'error');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: string) => {
    if (!active) return;
    await apiClient.patch(`/admin/support-tickets/${active.id}`, { status });
    setActive((prev) => (prev ? { ...prev, status } : prev));
    load();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Support Tickets</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-line bg-bg2 px-3 py-2 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <SectionInfo
        description="Support conversations opened by logged-in customers from their account. Replying here emails the customer their reply (they don't get a live in-app notification, just email) and auto-moves the ticket to 'in progress'; Closed tickets stop accepting new replies from either side."
        example={`a customer can't figure out how to reset their password and opens a ticket. You see it here, reply with the steps — they get an email with your reply, and the ticket status flips to "in progress" until you mark it resolved.`}
      />

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : !tickets.length ? (
        <EmptyState title="No tickets" description="Support tickets opened by customers appear here." />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3 font-medium">{t.subject}</td>
                  <td className="px-4 py-3 text-muted">{t.customer_name}</td>
                  <td className="px-4 py-3 text-muted capitalize">{t.status.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-muted">{new Date(t.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openTicket(t)} className="text-accent hover:opacity-80">
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-line bg-bg p-8">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl">{active.subject}</h2>
                <p className="text-sm text-muted">
                  {active.customer_name} &middot; {active.customer_email}
                </p>
              </div>
              {canUpdate && (
                <select
                  value={active.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="border border-line bg-bg2 px-2 py-1.5 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4 flex-1 space-y-3 overflow-y-auto border-t border-line pt-4">
              {active.messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] border p-3 text-sm ${m.sender_type === 'admin' ? 'ml-auto border-accent-dim bg-bg2' : 'border-line'}`}>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-faint">
                    {m.sender_type === 'admin' ? 'You' : active.customer_name} &middot; {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>

            {canUpdate && active.status !== 'closed' && (
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  className="flex-1 resize-none border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="shrink-0 bg-accent px-5 py-2.5 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Reply'}
                </button>
              </div>
            )}

            <button onClick={() => setActive(null)} className="mt-4 self-end text-sm text-muted hover:text-fg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
