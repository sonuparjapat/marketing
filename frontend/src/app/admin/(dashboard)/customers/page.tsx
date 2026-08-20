'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionInfo } from '@/components/admin/SectionInfo';

const PAGE_SIZE = 20;

type Customer = {
  id: number;
  name: string;
  email: string;
  is_premium: boolean;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
};

export default function AdminCustomersPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('customers.update');
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/customers', {
        params: { page: targetPage, limit: PAGE_SIZE, search: search || undefined },
      });
      setCustomers(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (page === 1) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleActive = async (customer: Customer) => {
    try {
      await apiClient.patch(`/admin/customers/${customer.id}`, { is_active: !customer.is_active });
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, is_active: !c.is_active } : c)));
      show(customer.is_active ? 'Account deactivated.' : 'Account reactivated.');
    } catch {
      show('Something went wrong.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Customers</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          aria-label="Search customers by name or email"
          className="w-64 border border-line bg-bg2 px-3.5 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
      </div>
      <SectionInfo
        description="Every public-site account (separate from admin accounts) — everyone who's registered to comment, review, subscribe, or buy a premium plan. Deactivate blocks their login without deleting their history (comments/reviews/tickets/payments they've already made stay intact); it's the account-suspension tool, not a data-deletion one."
        example="a customer is spamming abusive comments across the blog. You find their account here and click Deactivate — they can no longer log in, but their past comments (which you'd separately remove from the Comments page) and any purchase history stay on record."
      />

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : !customers.length ? (
        <EmptyState title="No customers yet" description="Accounts created from the public site will show up here." />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                {canUpdate && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.email}</td>
                  <td className="px-4 py-3 text-muted">{c.last_login ? new Date(c.last_login).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3 text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={c.is_active ? 'text-accent' : 'text-faint'}>{c.is_active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  {canUpdate && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(c)} className="text-accent hover:opacity-80">
                        {c.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </div>
  );
}
