'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from '@/components/admin/SectionInfo';

const PAGE_SIZE = 30;

const EVENT_LABEL: Record<string, string> = {
  new_lead: 'New lead',
  new_callback: 'New callback',
  new_ticket: 'New support ticket',
  new_ticket_message: 'Ticket reply',
};

type Notification = {
  id: number;
  event: string;
  title: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/notifications', { params: { page: targetPage, limit: PAGE_SIZE } });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const markRead = async (n: Notification) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    await apiClient.patch(`/admin/notifications/${n.id}/read`);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    await apiClient.patch('/admin/notifications/mark-all-read');
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Notifications</h1>
        {items.some((i) => !i.is_read) && (
          <button onClick={markAllRead} className="text-xs text-accent hover:opacity-80">
            Mark all read
          </button>
        )}
      </div>
      <SectionInfo
        description="A browsable history of every real-time alert this panel has fired — new leads, callbacks, and support ticket activity. The live toast/badge you see while working is ephemeral; this page is where that same event lives afterward so nothing gets missed just because you weren't looking at the screen when it happened."
        example="you step away for lunch and miss a live toast about a new lead. Coming back, you check this page and see it — click it to mark it read, or Mark all read to clear the badge at once."
      />

      {loading && !items.length ? (
        <div className="border border-line">
          <TableSkeleton rows={8} cols={2} />
        </div>
      ) : !items.length ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className={`flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
                n.is_read ? 'border-line-soft' : 'border-accent/40 bg-accent/5'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  <span className="text-xs uppercase tracking-wide text-accent">{EVENT_LABEL[n.event] || n.event}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-faint">{new Date(n.created_at).toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </div>
  );
}
