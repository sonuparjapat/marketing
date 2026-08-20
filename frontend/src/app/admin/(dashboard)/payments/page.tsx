'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { SectionInfo } from '@/components/admin/SectionInfo';

type Payment = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  plan_id: number;
  plan_name: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  created_at: string;
};

type PaymentLog = { id: number; event_type: string; metadata: Record<string, unknown>; created_at: string };

const STATUS_STYLE: Record<Payment['status'], string> = {
  created: 'text-faint',
  paid: 'text-accent-2',
  failed: 'text-red-400',
  refunded: 'text-muted',
};

export default function AdminPaymentsPage() {
  const PAGE_SIZE = 20;
  const { hasPermission } = useAdminAuth();
  const { show } = useToast();
  const canRefund = hasPermission('payments.update');

  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [logsFor, setLogsFor] = useState<Payment | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/payments', { params: { page: targetPage, limit: PAGE_SIZE } });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openLogs = async (payment: Payment) => {
    setLogsFor(payment);
    const res = await apiClient.get(`/admin/payments/${payment.id}/logs`);
    setLogs(res.data.data);
  };

  const confirmRefund = async () => {
    if (!refunding) return;
    setBusy(true);
    try {
      await apiClient.post(`/admin/payments/${refunding.id}/refund`);
      show('Refunded — the subscription has been revoked.');
      setRefunding(null);
      await load(page);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Refund failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Payments</h1>
      </div>
      <SectionInfo
        description="A read-only ledger of every subscription payment attempt — created, paid, failed, or refunded — the money trail behind the Subscription Plans page. Nothing here is editable except Refund, which is a real Razorpay refund, not just a status flag."
        example={`a customer emails asking for a refund on a plan they bought by mistake. You find their payment here, click Refund — it refunds them via Razorpay and immediately revokes the linked subscription, so they lose access to the premium content that plan granted.`}
      />

      {loading && !items.length ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={7} />
        </div>
      ) : !items.length ? (
        <EmptyState title="No payments yet" />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.customer_name}</div>
                    <div className="text-xs text-faint">{p.customer_email}</div>
                  </td>
                  <td className="px-4 py-3">{p.plan_name}</td>
                  <td className="px-4 py-3">₹{(p.amount_paise / 100).toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLE[p.status]}`}>{p.status}</td>
                  <td className="px-4 py-3 text-faint">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => openLogs(p)} className="mr-4 text-muted hover:text-fg">
                      Logs
                    </button>
                    {canRefund && p.status === 'paid' && (
                      <button onClick={() => setRefunding(p)} className="text-red-400 hover:opacity-80">
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      <Modal
        open={refunding !== null}
        onClose={() => setRefunding(null)}
        title="Refund this payment?"
        footer={
          <>
            <button onClick={() => setRefunding(null)} className="px-5 py-2.5 text-sm text-muted hover:text-fg">
              Cancel
            </button>
            <button
              onClick={confirmRefund}
              disabled={busy}
              className="bg-red-500/90 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? 'Refunding…' : 'Refund'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          This refunds <span className="text-fg">₹{refunding ? (refunding.amount_paise / 100).toLocaleString('en-IN') : ''}</span> to{' '}
          <span className="text-fg">{refunding?.customer_name}</span> via Razorpay and immediately revokes their subscription to{' '}
          <span className="text-fg">{refunding?.plan_name}</span>. This can&apos;t be undone.
        </p>
      </Modal>

      <Modal open={logsFor !== null} onClose={() => setLogsFor(null)} title={`Log — ${logsFor?.customer_name}`}>
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="border-b border-line-soft pb-3 last:border-0">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{l.event_type}</span>
                <span className="text-xs text-faint">{new Date(l.created_at).toLocaleString('en-IN')}</span>
              </div>
              {l.metadata && Object.keys(l.metadata).length > 0 && (
                <pre className="mt-1 overflow-x-auto text-[11px] text-faint">{JSON.stringify(l.metadata, null, 2)}</pre>
              )}
            </div>
          ))}
          {!logs.length && <p className="text-sm text-faint">No log entries.</p>}
        </div>
      </Modal>
    </div>
  );
}
