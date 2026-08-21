'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/Skeleton';
import { SectionInfo } from '@/components/admin/SectionInfo';

type Analytics = {
  leadsByDay: { day: string; count: number }[];
  topServices: { service: string; count: number }[];
  topPages: { path: string; count: number }[];
  pageViews30d: number;
  revenueByMonth: { month: string; amount_paise: number; source: 'subscriptions' | 'invoices' }[];
  invoiceStatusBreakdown: { status: string; count: number }[];
  topPlans: { name: string; revenue: number }[];
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
  draft: 'var(--faint)',
  sent: '#e0a458',
  paid: 'var(--accent)',
  overdue: '#e0645f',
  cancelled: 'var(--faint)',
  refunded: 'var(--muted)',
};

// The API returns one row per (month, source) — pivot into one row per month with both sources as
// separate keys, so Recharts can render a grouped bar per month in a single pass.
function pivotRevenue(rows: Analytics['revenueByMonth']) {
  const byMonth = new Map<string, { month: string; subscriptions: number; invoices: number }>();
  for (const r of rows) {
    const entry = byMonth.get(r.month) || { month: r.month, subscriptions: 0, invoices: 0 };
    entry[r.source] = r.amount_paise / 100;
    byMonth.set(r.month, entry);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const revenueRows = data ? pivotRevenue(data.revenueByMonth) : [];

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
      <h1 className="mb-2 font-serif text-2xl">Analytics</h1>
      <SectionInfo
        description="A read-only summary of both traffic and money — lead submissions and pageview pings for the traffic charts, and paid premium subscriptions plus paid client invoices for the revenue charts below. Nothing here is editable, it's purely for spotting trends. This is also where 'Reports' lives — deliberately not a separate page, so revenue and traffic data isn't split across two nav entries."
        example="you notice the leads-by-day chart spikes every Tuesday. That tells you something (a newsletter send day? a paid ad schedule?) worth digging into outside this panel — this page surfaces the pattern, it doesn't explain it."
      />

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

      <div className="mb-10 border border-line bg-bg2 p-6">
        <div className="mb-1 text-xs uppercase tracking-[0.2em] text-accent">Revenue — last 6 months</div>
        <p className="mb-4 text-[11px] text-faint">Paid premium subscriptions and paid client invoices, in ₹, by month.</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="month" stroke="var(--faint)" fontSize={11} />
            <YAxis stroke="var(--faint)" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--line)', fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="subscriptions" name="Subscriptions" fill="var(--accent)" />
            <Bar dataKey="invoices" name="Invoices" fill="var(--accent-2, #5fc9a8)" />
          </BarChart>
        </ResponsiveContainer>
        {!revenueRows.length && <p className="mt-3 text-sm text-faint">No paid revenue recorded yet.</p>}
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="border border-line bg-bg2 p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Invoices by status</div>
          <div className="space-y-2">
            {data.invoiceStatusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between border-b border-line py-2 text-sm">
                <span className="capitalize" style={{ color: INVOICE_STATUS_COLOR[s.status] || 'var(--fg)' }}>
                  {s.status}
                </span>
                <span className="text-muted">{s.count}</span>
              </div>
            ))}
            {!data.invoiceStatusBreakdown.length && <p className="text-sm text-faint">No invoices yet.</p>}
          </div>
        </div>

        <div className="border border-line bg-bg2 p-6">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Top plans by revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topPlans.map((p) => ({ ...p, revenue: p.revenue / 100 }))} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" stroke="var(--faint)" fontSize={11} />
              <YAxis dataKey="name" type="category" width={120} stroke="var(--faint)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--line)', fontSize: 12 }} formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
              <Bar dataKey="revenue" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
          {!data.topPlans.length && <p className="text-sm text-faint">No plan revenue yet.</p>}
        </div>
      </div>
    </div>
  );
}
