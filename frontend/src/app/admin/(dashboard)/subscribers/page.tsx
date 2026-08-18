'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminSubscribersPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/subscribers', { params: { limit: 200 } });
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get('/admin/subscribers/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscribers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Subscribers ({total})</h1>
        <button onClick={exportCsv} disabled={exporting} className="border border-line px-5 py-2.5 text-sm hover:border-accent hover:text-accent disabled:opacity-60">
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-muted">{s.name || '—'}</td>
                <td className="px-4 py-3 text-muted">{s.is_active ? 'Active' : 'Unsubscribed'}</td>
                <td className="px-4 py-3 text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && !items.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-faint">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
