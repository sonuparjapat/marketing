'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionInfo } from '@/components/admin/SectionInfo';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';

const STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;

type Appointment = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  admin_name: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: (typeof STATUSES)[number];
  notes: string | null;
};

type ClientOption = { id: number; name: string };

const STATUS_STYLE: Record<Appointment['status'], string> = {
  scheduled: 'text-accent',
  completed: 'text-muted',
  cancelled: 'text-faint',
  no_show: 'text-red-400',
};

export default function AdminAppointmentsPage() {
  const { hasPermission } = useAdminAuth();
  const { show } = useToast();
  const canCreate = hasPermission('appointments.create');
  const canUpdate = hasPermission('appointments.update');

  const [items, setItems] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', client_id: '', scheduled_at: '', duration_minutes: '30', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/appointments', { params: { when: tab, limit: 100 } });
      setItems(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    apiClient.get('/admin/clients', { params: { limit: 100 } }).then((res) => setClients(res.data.data.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openCreate = () => {
    setForm({ title: '', client_id: '', scheduled_at: '', duration_minutes: '30', notes: '' });
    setError('');
    setCreating(true);
  };

  const onCreate = async () => {
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.scheduled_at) return setError('Pick a date and time.');
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/admin/appointments', {
        title: form.title.trim(),
        client_id: form.client_id ? Number(form.client_id) : undefined,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes),
        notes: form.notes || undefined,
      });
      setCreating(false);
      await load();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (appt: Appointment, status: Appointment['status']) => {
    setItems((prev) => prev.map((a) => (a.id === appt.id ? { ...a, status } : a)));
    try {
      await apiClient.put(`/admin/appointments/${appt.id}`, { status });
    } catch {
      show('Could not update — reloading.', 'error');
      load();
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Appointments</h1>
        {canCreate && <Button onClick={openCreate}>+ Schedule</Button>}
      </div>
      <SectionInfo
        description="An internal record of scheduled calls and meetings with leads or clients — not a public booking calendar. There's no self-service booking link, no reminder emails, and no timezone handling; this is purely for the team to log and track who's talking to whom, and when."
        example="you're about to hop on a call with a promising lead. You log it here beforehand with a title and time — after the call, mark it Completed (or No-show if they didn't join) so there's a record of the conversation history."
      />

      <div className="mb-5 flex gap-1 rounded-full border border-line-soft p-1 text-xs w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`rounded-full px-3.5 py-1.5 uppercase tracking-wide transition-colors ${tab === 'upcoming' ? 'bg-accent text-bg' : 'text-muted hover:text-accent'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab('past')}
          className={`rounded-full px-3.5 py-1.5 uppercase tracking-wide transition-colors ${tab === 'past' ? 'bg-accent text-bg' : 'text-muted hover:text-accent'}`}
        >
          Past
        </button>
      </div>

      {loading && !items.length ? (
        <div className="border border-line">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : !items.length ? (
        <EmptyState title={tab === 'upcoming' ? 'Nothing scheduled' : 'No past appointments'} />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft p-4">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="mt-0.5 text-xs text-faint">
                  {new Date(a.scheduled_at).toLocaleString('en-IN')} &middot; {a.duration_minutes} min
                  {a.client_name && (
                    <>
                      {' '}
                      &middot;{' '}
                      <Link href={`/admin/clients/${a.client_id}`} className="hover:text-accent">
                        {a.client_name}
                      </Link>
                    </>
                  )}
                  {a.admin_name && <> &middot; with {a.admin_name}</>}
                </div>
              </div>
              {canUpdate ? (
                <select
                  value={a.status}
                  onChange={(e) => updateStatus(a, e.target.value as Appointment['status'])}
                  className="border border-line bg-bg2 px-2 py-1.5 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`text-xs font-medium ${STATUS_STYLE[a.status]}`}>{a.status.replace('_', ' ')}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Schedule an appointment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Onboarding call" />
          <Select label="Client (optional)" value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}>
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date & time" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
            <Input label="Duration (min)" type="number" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} />
          </div>
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Modal>
    </div>
  );
}
