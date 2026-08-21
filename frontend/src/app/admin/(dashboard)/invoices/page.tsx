'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from '@/components/admin/SectionInfo';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';

const PAGE_SIZE = 20;
const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'] as const;

type Invoice = {
  id: number;
  client_id: number;
  client_name: string;
  invoice_number: string;
  description: string | null;
  amount_paise: number;
  status: (typeof STATUSES)[number];
  due_date: string | null;
  razorpay_payment_link_url: string | null;
  created_at: string;
};

type ClientOption = { id: number; name: string };

const STATUS_STYLE: Record<Invoice['status'], string> = {
  draft: 'text-faint',
  sent: 'text-amber-400',
  paid: 'text-accent',
  overdue: 'text-red-400',
  cancelled: 'text-faint',
  refunded: 'text-muted',
};

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminInvoicesPage() {
  const { hasPermission } = useAdminAuth();
  const { show } = useToast();
  const canCreate = hasPermission('invoices.create');
  const canUpdate = hasPermission('invoices.update');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [busyId, setBusyId] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_id: '', description: '', amount_rupees: '', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/invoices', {
        params: { page: targetPage, limit: PAGE_SIZE, status: statusFilter || undefined },
      });
      setInvoices(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    apiClient.get('/admin/clients', { params: { limit: 100 } }).then((res) => setClients(res.data.data.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (page === 1) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setForm({ client_id: '', description: '', amount_rupees: '', due_date: '' });
    setError('');
    setCreating(true);
  };

  const onCreate = async () => {
    if (!form.client_id) return setError('Pick a client.');
    if (!form.amount_rupees || Number(form.amount_rupees) <= 0) return setError('Enter an amount.');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/admin/invoices', {
        client_id: Number(form.client_id),
        description: form.description || undefined,
        amount_paise: Math.round(Number(form.amount_rupees) * 100),
        due_date: form.due_date || undefined,
      });
      setCreating(false);
      await load(1);
      setPage(1);
    } catch (err) {
      setError(errMessage(err, 'Something went wrong.'));
    } finally {
      setSaving(false);
    }
  };

  const act = async (invoice: Invoice, action: 'send' | 'mark-paid' | 'cancel') => {
    setBusyId(invoice.id);
    try {
      const res = await apiClient.post(`/admin/invoices/${invoice.id}/${action}`);
      setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? res.data.data : i)));
      show(action === 'send' ? 'Invoice sent.' : action === 'mark-paid' ? 'Marked paid.' : 'Invoice cancelled.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Invoices</h1>
        {canCreate && <Button onClick={openCreate}>+ New invoice</Button>}
      </div>
      <SectionInfo
        description="Billing a Client for project work, paid via a Razorpay payment link emailed straight to them — separate from the Payments page, which is customer premium-subscription purchases, not agency billing. A draft is invisible to the client until you Send it; sending locks in a Razorpay payment link and can't be repeated (double-clicking Send never creates two links). Mark Paid is for offline payment (bank transfer, cash) when a client doesn't pay via the link."
        example={`you finish a month of work for a client and bill them ₹50,000. You create the invoice as a draft, review it, click Send — they get an email with a secure payment link, and the invoice flips to "sent". Once they pay, it flips to "paid" automatically via Razorpay, no action needed from you.`}
      />

      <div className="mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-line bg-bg2 px-3.5 py-2.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && !invoices.length ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : !invoices.length ? (
        <EmptyState title="No invoices yet" description={canCreate ? 'Create the first one to get started.' : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-muted">
                    <Link href={`/admin/clients/${inv.client_id}`} className="hover:text-accent">
                      {inv.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">₹{(inv.amount_paise / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-muted">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLE[inv.status]}`}>{inv.status}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {canUpdate && inv.status === 'draft' && (
                      <button onClick={() => act(inv, 'send')} disabled={busyId === inv.id} className="mr-3 text-accent hover:opacity-80 disabled:opacity-60">
                        Send
                      </button>
                    )}
                    {canUpdate && ['sent', 'overdue'].includes(inv.status) && (
                      <>
                        <button onClick={() => act(inv, 'mark-paid')} disabled={busyId === inv.id} className="mr-3 text-accent hover:opacity-80 disabled:opacity-60">
                          Mark paid
                        </button>
                        <button onClick={() => act(inv, 'cancel')} disabled={busyId === inv.id} className="text-red-400 hover:opacity-80 disabled:opacity-60">
                          Cancel
                        </button>
                      </>
                    )}
                    {canUpdate && inv.status === 'draft' && (
                      <button onClick={() => act(inv, 'cancel')} disabled={busyId === inv.id} className="ml-3 text-red-400 hover:opacity-80 disabled:opacity-60">
                        Cancel
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
        open={creating}
        onClose={() => setCreating(false)}
        title="New invoice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving}>
              Create draft
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select label="Client" value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (₹)"
            type="number"
            help="Charged in full via the Razorpay payment link once you send this invoice."
            value={form.amount_rupees}
            onChange={(e) => setForm((p) => ({ ...p, amount_rupees: e.target.value }))}
          />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Modal>
    </div>
  );
}
