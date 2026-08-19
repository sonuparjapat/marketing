'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/Skeleton';

type Analytics = {
  leadsByDay: { day: string; count: number }[];
  topServices: { service: string; count: number }[];
  topPages: { path: string; count: number }[];
  pageViews30d: number;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    apiClient.get('/admin/analytics').then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <div>
        <h1 className="mb-8 font-serif text-2xl">Analytics</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 font-serif text-2xl">Analytics</h1>

      <div className="mb-10 border border-line bg-bg2 p-6">
        <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Leads — last 14 days</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.leadsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} stroke="var(--faint)" fontSize={11} />
            <YAxis allowDecimals={false} stroke="var(--faint)" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--line)', fontSize: 12 }} />
            <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="border border-line bg-bg2 p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Top service interest (all-time)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topServices} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" allowDecimals={false} stroke="var(--faint)" fontSize={11} />
              <YAxis dataKey="service" type="category" width={120} stroke="var(--faint)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--line)', fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-line bg-bg2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-accent">Top pages — last 30 days</span>
            <span className="text-xs text-faint">{data.pageViews30d} total views</span>
          </div>
          <div className="space-y-2">
            {data.topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between border-b border-line py-2 text-sm">
                <span className="text-fg">{p.path}</span>
                <span className="text-accent">{p.count}</span>
              </div>
            ))}
            {!data.topPages.length && <p className="text-sm text-faint">No traffic recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
