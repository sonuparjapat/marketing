'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from '@/components/admin/SectionInfo';

const PAGE_SIZE = 20;

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_interested: string | null;
  budget_range: string | null;
  message: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export default function AdminLeadsPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('leads.update');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [active, setActive] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/leads', {
        params: { page: targetPage, limit: PAGE_SIZE, status: statusFilter || undefined },
      });
      setLeads(res.data.data.items);
      setTotal(res.data.data.total ?? res.data.data.items.length);
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

  const updateStatus = async (lead: Lead, status: string) => {
    await apiClient.patch(`/admin/leads/${lead.id}`, { status });
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
  };

  const openDetail = (lead: Lead) => {
    setActive(lead);
    setNotes(lead.notes || '');
  };

  const saveNotes = async () => {
    if (!active) return;
    await apiClient.patch(`/admin/leads/${active.id}`, { notes });
    setLeads((prev) => prev.map((l) => (l.id === active.id ? { ...l, notes } : l)));
    setActive(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Leads</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-line bg-bg2 px-3 py-2 text-sm"
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
      <SectionInfo
        description="Every submission from the public /contact form — the agency's actual sales pipeline. Status tracks where a prospect is in the funnel; the Status dropdown here is the only place that changes, nothing about the lead is auto-advanced. An open Slack/email alert also fires the moment a new one comes in (see the notification badge in the sidebar)."
        example={`someone fills out the contact form asking about SEO. They appear here as "new" — you call them, move their status to "contacted", and jot down what was discussed in View → Internal notes so the next person to touch this lead has context.`}
      />

      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                <td className="px-4 py-3 font-medium">{lead.name}</td>
                <td className="px-4 py-3 text-muted">
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ''}
                </td>
                <td className="px-4 py-3 text-muted">{lead.service_interested || '—'}</td>
                <td className="px-4 py-3 text-muted">{lead.source || '—'}</td>
                <td className="px-4 py-3 text-muted">{new Date(lead.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {canUpdate ? (
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead, e.target.value)}
                      className="border border-line bg-bg2 px-2 py-1.5 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted">{lead.status}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openDetail(lead)} className="text-accent hover:opacity-80">
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !leads.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-faint">
                  No leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-lg border border-line bg-bg p-8">
            <h2 className="mb-1 font-serif text-xl">{active.name}</h2>
            <p className="mb-6 text-sm text-muted">{active.email}</p>
            <dl className="mb-6 space-y-2 text-sm">
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-faint">Phone</dt>
                <dd>{active.phone || '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-faint">Company</dt>
                <dd>{active.company || '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-faint">Budget</dt>
                <dd>{active.budget_range || '—'}</dd>
              </div>
              <div className="border-b border-line py-2">
                <dt className="mb-1 text-faint">Message</dt>
                <dd>{active.message || '—'}</dd>
              </div>
            </dl>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Internal notes
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  Private — the lead never sees this. Use it to log call outcomes or context for whoever follows up next.
                </span>
              </span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canUpdate}
                className="w-full resize-none border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setActive(null)} className="px-5 py-2.5 text-sm text-muted hover:text-fg">
                Close
              </button>
              {canUpdate && (
                <button onClick={saveNotes} className="bg-accent px-6 py-2.5 text-sm font-bold text-bg hover:opacity-90">
                  Save notes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
