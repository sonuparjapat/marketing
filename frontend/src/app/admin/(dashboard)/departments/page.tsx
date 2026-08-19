'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';

type Permission = { id: number; key: string; module: string; action: string; label: string };
type PermissionCatalog = Record<string, Permission[]>;
type Department = {
  id: number;
  name: string;
  description: string | null;
  permission_keys: string[];
  admin_count: number;
  created_at: string;
};

const MODULE_LABELS: Record<string, string> = {
  leads: 'Leads',
  callbacks: 'Callbacks',
  subscribers: 'Subscribers',
  posts: 'Blog Posts',
  blog_categories: 'Blog Categories',
  case_studies: 'Case Studies',
  services: 'Services',
  testimonials: 'Testimonials',
  team: 'Team',
  faqs: 'FAQs',
  pages: 'Pages',
  nav_links: 'Nav Links',
  homepage_stats: 'Homepage Stats',
  why_us: 'Why Us',
  client_logos: 'Client Logos',
  homepage_sections: 'Homepage Sections',
  media: 'Media Library',
  settings: 'Settings',
  docs: 'Docs',
  analytics: 'Analytics',
  logs: 'Activity Log',
};

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permission_keys: [] as string[] });
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [deptRes, permRes] = await Promise.all([
        apiClient.get('/admin/departments'),
        apiClient.get('/admin/permissions'),
      ]);
      setDepartments(deptRes.data.data.items);
      setCatalog(permRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const modules = useMemo(() => Object.keys(catalog), [catalog]);

  const openCreate = () => {
    setForm({ name: '', description: '', permission_keys: [] });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (dept: Department) => {
    setForm({ name: dept.name, description: dept.description || '', permission_keys: dept.permission_keys });
    setEditing(dept);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const togglePermission = (key: string) => {
    setForm((p) => ({
      ...p,
      permission_keys: p.permission_keys.includes(key)
        ? p.permission_keys.filter((k) => k !== key)
        : [...p.permission_keys, key],
    }));
  };

  const toggleModule = (module: string, keys: string[]) => {
    setForm((p) => {
      const allSelected = keys.every((k) => p.permission_keys.includes(k));
      return {
        ...p,
        permission_keys: allSelected
          ? p.permission_keys.filter((k) => !keys.includes(k))
          : Array.from(new Set([...p.permission_keys, ...keys])),
      };
    });
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      show('Department name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (creating) {
        await apiClient.post('/admin/departments', form);
      } else if (editing) {
        await apiClient.put(`/admin/departments/${editing.id}`, form);
      }
      close();
      await load();
      show('Department saved.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (dept: Department) => {
    if (!confirm(`Delete "${dept.name}"? This can't be undone.`)) return;
    try {
      await apiClient.delete(`/admin/departments/${dept.id}`);
      await load();
      show('Department deleted.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    }
  };

  const modalOpen = creating || editing !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Departments</h1>
          <p className="mt-1 text-xs text-faint">Each department grants a fixed set of permissions to the admins assigned to it.</p>
        </div>
        <Button onClick={openCreate}>+ New department</Button>
      </div>

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={4} cols={4} />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState title="No departments yet" description="Create one to start assigning granular permissions to your team." />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Admins</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-muted">{d.description || '—'}</td>
                  <td className="px-4 py-3 text-muted">{d.permission_keys.length}</td>
                  <td className="px-4 py-3 text-muted">{d.admin_count}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button onClick={() => openEdit(d)} className="mr-4 text-accent hover:opacity-80">
                      Edit
                    </button>
                    <button onClick={() => onDelete(d)} className="text-red-400 hover:opacity-80">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={close}
        title={creating ? 'New department' : `Edit ${editing?.name}`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div>
            <span className="mb-3 block text-xs uppercase tracking-wide text-muted">Permissions</span>
            <div className="max-h-80 space-y-4 overflow-y-auto border border-line p-4">
              {modules.map((module) => {
                const perms = catalog[module];
                const keys = perms.map((p) => p.key);
                const allSelected = keys.every((k) => form.permission_keys.includes(k));
                return (
                  <div key={module}>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                      <input type="checkbox" checked={allSelected} onChange={() => toggleModule(module, keys)} className="h-3.5 w-3.5 accent-accent" />
                      {MODULE_LABELS[module] || module}
                    </label>
                    <div className="ml-5 flex flex-wrap gap-x-5 gap-y-1.5">
                      {perms.map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-sm text-muted">
                          <input
                            type="checkbox"
                            checked={form.permission_keys.includes(p.key)}
                            onChange={() => togglePermission(p.key)}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
