'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';

type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  department_id: number | null;
  department_name: string | null;
  last_login: string | null;
  created_at: string;
};

type Department = { id: number; name: string };

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'editor', department_id: '' });
  const [editForm, setEditForm] = useState({ name: '', role: 'editor', department_id: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const { show } = useToast();
  const { admin: me } = useAdminAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [adminsRes, deptRes] = await Promise.all([
        apiClient.get('/admin/admins'),
        apiClient.get('/admin/departments'),
      ]);
      setAdmins(adminsRes.data.data.items);
      setDepartments(deptRes.data.data.items);
    } catch {
      show('Only a super admin can manage other admins.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setCreateForm({ name: '', email: '', password: '', role: 'editor', department_id: '' });
    setCreating(true);
  };

  const openEdit = (admin: AdminRow) => {
    setEditForm({
      name: admin.name,
      role: admin.role,
      department_id: admin.department_id ? String(admin.department_id) : '',
      is_active: admin.is_active,
    });
    setEditing(admin);
  };

  const onCreate = async () => {
    setSaving(true);
    try {
      await apiClient.post('/admin/admins', {
        ...createForm,
        department_id: createForm.role === 'super_admin' || !createForm.department_id ? null : Number(createForm.department_id),
      });
      show('Admin created.');
      setCreating(false);
      await load();
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/admins/${editing.id}`, {
        name: editForm.name,
        role: editForm.role,
        department_id: editForm.role === 'super_admin' || !editForm.department_id ? null : Number(editForm.department_id),
        is_active: editForm.is_active,
      });
      show('Admin updated.');
      setEditing(null);
      await load();
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Admins</h1>
        <Button onClick={openCreate}>+ New admin</Button>
      </div>

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={3} cols={5} />
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
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
                  <td className="px-4 py-3 text-muted">{a.role === 'super_admin' ? 'Super admin' : 'Editor'}</td>
                  <td className="px-4 py-3 text-muted">{a.role === 'super_admin' ? '—' : a.department_name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-muted">{a.last_login ? new Date(a.last_login).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={a.is_active ? 'text-accent' : 'text-faint'}>{a.is_active ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(a)} className="text-accent hover:opacity-80">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New admin"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} loading={saving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
          />
          <Input
            label="Password (min 8 characters)"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
          />
          <Select label="Role" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="editor">Editor — permissions from department</option>
            <option value="super_admin">Super admin — manages everything</option>
          </Select>
          {createForm.role !== 'super_admin' && (
            <Select
              label="Department"
              value={createForm.department_id}
              onChange={(e) => setCreateForm((p) => ({ ...p, department_id: e.target.value }))}
            >
              <option value="">Unassigned (no permissions)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={onSaveEdit} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          <Select label="Role" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="editor">Editor — permissions from department</option>
            <option value="super_admin">Super admin — manages everything</option>
          </Select>
          {editForm.role !== 'super_admin' && (
            <Select
              label="Department"
              value={editForm.department_id}
              onChange={(e) => setEditForm((p) => ({ ...p, department_id: e.target.value }))}
            >
              <option value="">Unassigned (no permissions)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          {editing?.id !== me?.id && (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-sm">Active</span>
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
