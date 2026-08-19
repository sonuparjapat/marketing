'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

type Callback = {
  id: number;
  name: string;
  phone: string;
  preferred_time: string | null;
  status: string;
  created_at: string;
};

export default function AdminCallbacksPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('callbacks.update');
  const [items, setItems] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/callbacks', { params: { page: targetPage, limit: PAGE_SIZE } });
      setItems(res.data.data.items);
      setTotal(res.data.data.total ?? res.data.data.items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const toggleStatus = async (cb: Callback) => {
    const next = cb.status === 'called' ? 'pending' : 'called';
    await apiClient.patch(`/admin/callbacks/${cb.id}`, { status: next });
    setItems((prev) => prev.map((c) => (c.id === cb.id ? { ...c, status: next } : c)));
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Callback Requests</h1>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Preferred time</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              {canUpdate && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {items.map((cb) => (
              <tr key={cb.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                <td className="px-4 py-3 font-medium">{cb.name}</td>
                <td className="px-4 py-3 text-muted">{cb.phone}</td>
                <td className="px-4 py-3 text-muted">{cb.preferred_time || '—'}</td>
                <td className="px-4 py-3 text-muted">{new Date(cb.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cb.status === 'called' ? 'text-accent' : 'text-muted'}>{cb.status}</span>
                </td>
                {canUpdate && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleStatus(cb)} className="text-accent hover:opacity-80">
                      Mark as {cb.status === 'called' ? 'pending' : 'called'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!loading && !items.length && (
              <tr>
                <td colSpan={canUpdate ? 6 : 5} className="px-4 py-8 text-center text-faint">
                  No callback requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </div>
  );
}
