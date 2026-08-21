'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from '@/components/admin/SectionInfo';

const PAGE_SIZE = 20;
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;

type Project = {
  id: number;
  client_id: number;
  client_name: string;
  name: string;
  status: (typeof STATUSES)[number];
  start_date: string | null;
  end_date: string | null;
  budget_paise: number | null;
  updated_at: string;
};

const STATUS_STYLE: Record<Project['status'], string> = {
  planning: 'text-faint',
  active: 'text-accent',
  on_hold: 'text-amber-400',
  completed: 'text-muted',
  cancelled: 'text-red-400',
};

export default function AdminProjectsPage() {
  const { hasPermission } = useAdminAuth();
  const canCreate = hasPermission('projects.create');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/projects', {
        params: { page: targetPage, limit: PAGE_SIZE, status: statusFilter || undefined },
      });
      setProjects(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (page === 1) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Projects</h1>
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
        description="Every piece of work being done for a client — a Project always belongs to one Client. New projects are created from a Client's detail page, not here; this page is the cross-client work list, filterable by status. Open a project to manage its task checklist."
        example="a client signs on for a 3-month SEO overhaul. You create the project from their Client page, work through it here as tasks get done, and mark it Completed when it wraps — it stays on record either way, just filterable out of the active view."
      />

      {canCreate && !projects.length && !loading && (
        <p className="mb-4 text-sm text-faint">New projects are created from a Client&apos;s detail page.</p>
      )}

      {loading && !projects.length ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : !projects.length ? (
        <EmptyState title="No projects yet" description="Create one from a Client's detail page." />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-accent">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <Link href={`/admin/clients/${p.client_id}`} className="hover:text-accent">
                      {p.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.budget_paise ? `₹${(p.budget_paise / 100).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-4 py-3 text-muted">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_STYLE[p.status]}`}>{p.status.replace('_', ' ')}</td>
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
