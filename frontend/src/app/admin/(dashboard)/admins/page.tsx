'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { getAdminUser } from '@/lib/adminAuth';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
};

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' });
  const [saving, setSaving] = useState(false);
  const { show } = useToast();
  const me = getAdminUser();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/admins');
      setAdmins(res.data.data.items);
    } catch {
      show('Only a super admin can manage other admins.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    setSaving(true);
    try {
      await apiClient.post('/admin/admins', form);
      show('Admin created.');
      setCreating(false);
      setForm({ name: '', email: '', password: '', role: 'editor' });
      await load();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (admin: AdminRow) => {
    try {
      await apiClient.patch(`/admin/admins/${admin.id}`, { is_active: !admin.is_active });
      await load();
      show(admin.is_active ? 'Admin deactivated.' : 'Admin reactivated.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Something went wrong.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Admins</h1>
        <button onClick={() => setCreating(true)} className="bg-accent px-5 py-2.5 text-sm font-bold text-bg hover:opacity-90">
          + New admin
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.email}</td>
                  <td className="px-4 py-3 text-muted">{a.role}</td>
                  <td className="px-4 py-3 text-muted">{a.last_login ? new Date(a.last_login).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={a.is_active ? 'text-accent' : 'text-faint'}>{a.is_active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.id !== me?.id && (
                      <button onClick={() => toggleActive(a)} className="text-accent hover:opacity-80">
                        {a.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md border border-line bg-bg p-8">
            <h2 className="mb-6 font-serif text-xl">New admin</h2>
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Password (min 8 characters)</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="editor">Editor — manages content</option>
                  <option value="super_admin">Super admin — manages everything</option>
                </select>
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button onClick={() => setCreating(false)} className="px-5 py-2.5 text-sm text-muted hover:text-fg">
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={saving}
                className="bg-accent px-6 py-2.5 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
