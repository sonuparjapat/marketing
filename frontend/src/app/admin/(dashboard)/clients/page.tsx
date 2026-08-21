'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from '@/components/admin/SectionInfo';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';

const PAGE_SIZE = 20;
const STATUSES = ['active', 'paused', 'archived', 'churned'];

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  status: 'active' | 'paused' | 'archived' | 'churned';
  account_manager_name: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<Client['status'], string> = {
  active: 'text-accent',
  paused: 'text-faint',
  archived: 'text-faint',
  churned: 'text-red-400',
};

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', industry: '', notes: '' };

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminClientsPage() {
  const { hasPermission } = useAdminAuth();
  const canCreate = hasPermission('clients.create');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/clients', {
        params: { page: targetPage, limit: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined },
      });
      setClients(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    if (page === 1) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setCreating(true);
  };

  const onCreate = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/admin/clients', form);
      setCreating(false);
      await load(1);
      setPage(1);
    } catch (err) {
      setError(errMessage(err, 'Something went wrong.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Clients</h1>
        {canCreate && <Button onClick={openCreate}>+ New client</Button>}
      </div>
      <SectionInfo
        description="The agency's actual paying clients — a business relationship, not a website account. Separate entirely from Customers (public blog/premium-subscriber accounts). Most clients arrive by converting a won Lead, but you can also add one directly here."
        example="a lead you've been talking to for weeks finally signs. On the Leads page you click Convert to client — a Client record is created here with their contact details carried over, and you can start tracking Projects, Invoices, and Documents against them going forward."
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or company…"
          className="w-64 border border-line bg-bg2 px-3.5 py-2.5 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
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

      {loading && !clients.length ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : !clients.length ? (
        <EmptyState title="No clients yet" description={canCreate ? 'Add one directly, or convert a won lead.' : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Account manager</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.email || c.phone || '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.account_manager_name || '—'}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</td>
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
        title="New client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" help="The client's contact name or business name — shown everywhere this client is referenced." value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" help="Used to send invoice payment links once Invoices is set up." value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Company" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
          <Input label="Industry" help="Free text, e.g. 'D2C Skincare' — purely for your own reference." value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} />
          <Textarea label="Notes" rows={3} help="Private — internal context, never shown to the client." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Modal>
    </div>
  );
}
