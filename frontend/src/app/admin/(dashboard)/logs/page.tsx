'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/Skeleton';

type LogRow = {
  id: number;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  module: string;
  record_id: string | null;
  created_at: string;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/admin/logs', { params: { limit: 100 } })
      .then((res) => setLogs(res.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-3 font-serif text-2xl">Activity Log</h1>
      <p className="mb-8 text-sm leading-relaxed text-muted">
        <strong className="text-fg">What this does:</strong> an automatic, unfakeable audit trail — every create/update/
        delete made anywhere in this admin panel is logged here the instant it happens, with who did it and when.
        Nothing here is editable; it&apos;s a record, not a tool.
        <br />
        <span className="text-faint">
          Example: a homepage stat looks wrong and nobody remembers changing it. Search this log by module
          (&quot;homepage_stats&quot;) to see exactly who edited it and when, without asking around.
        </span>
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{l.admin_name || l.admin_email || 'Unknown'}</td>
                  <td className="px-4 py-3 capitalize text-accent">{l.action}</td>
                  <td className="px-4 py-3 text-muted">{l.module}</td>
                  <td className="px-4 py-3 text-muted">{l.record_id || '—'}</td>
                  <td className="px-4 py-3 text-muted">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-faint">
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
