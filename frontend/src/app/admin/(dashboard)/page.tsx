'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useAdminSocket } from '@/lib/useAdminSocket';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Skeleton } from '@/components/Skeleton';

type Stats = {
  leadsToday: number | null;
  leadsTotal: number | null;
  activeSubscribers: number;
  blogViewsThisMonth: number;
  pendingCallbacks: number;
  recentLeads: { id: number; name: string; email: string; status: string; created_at: string }[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { hasPermission } = useAdminAuth();
  const canViewLeads = hasPermission('leads.read');

  const load = useCallback(() => {
    apiClient.get('/admin/stats').then((res) => setStats(res.data.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminSocket({ onNewLead: load, onNewCallback: load });

  const cards = stats
    ? [
        ...(canViewLeads
          ? [
              { label: "Today's leads", value: stats.leadsToday },
              { label: 'Total leads', value: stats.leadsTotal },
            ]
          : []),
        { label: 'Active subscribers', value: stats.activeSubscribers },
        { label: 'Blog views this month', value: stats.blogViewsThisMonth },
        { label: 'Pending callbacks', value: stats.pendingCallbacks },
      ]
    : [];

  return (
    <div>
      <h1 className="mb-8 font-serif text-2xl">Dashboard</h1>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats
          ? cards.map((c) => (
              <div key={c.label} className="border border-line bg-bg2 p-5">
                <div className="font-serif-italic text-3xl text-accent">{c.value}</div>
                <div className="mt-1 text-xs text-muted">{c.label}</div>
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-line bg-bg2 p-5">
                <Skeleton className="mb-2 h-8 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
      </div>

      {canViewLeads && (
        <div className="border border-line">
          <div className="flex items-center justify-between border-b border-line bg-bg2 px-5 py-3">
            <h2 className="text-sm font-semibold">Recent leads</h2>
            <Link href="/admin/leads" className="text-xs text-accent hover:opacity-80">
              View all
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {stats?.recentLeads.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium">{l.name}</td>
                  <td className="px-5 py-3 text-muted">{l.email}</td>
                  <td className="px-5 py-3 text-muted">{l.status}</td>
                  <td className="px-5 py-3 text-muted">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats && !stats.recentLeads.length && (
                <tr>
                  <td className="px-5 py-8 text-center text-faint" colSpan={4}>
                    No leads yet.
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
