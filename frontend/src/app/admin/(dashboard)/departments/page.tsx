'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';

type Permission = { id: number; resource_key: string; label: string; module_group: string };
type PermissionCatalog = Record<string, Permission[]>;
type Grant = { can_create: boolean; can_read: boolean; can_update: boolean; can_delete: boolean };
type PermissionGrant = Grant & { resource_key: string };
type Department = {
  id: number;
  name: string;
  description: string | null;
  permissions: PermissionGrant[];
  admin_count: number;
  created_at: string;
};

const CRUD_ACTIONS: { key: keyof Grant; label: string }[] = [
  { key: 'can_create', label: 'Create' },
  { key: 'can_read', label: 'Read' },
  { key: 'can_update', label: 'Update' },
  { key: 'can_delete', label: 'Delete' },
];

const EMPTY_GRANT: Grant = { can_create: false, can_read: false, can_update: false, can_delete: false };

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

function grantCount(grants: PermissionGrant[]) {
  return grants.reduce((n, g) => n + CRUD_ACTIONS.filter((a) => g[a.key]).length, 0);
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grants, setGrants] = useState<Record<string, Grant>>({});
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

  const groups = useMemo(() => Object.keys(catalog), [catalog]);
  const allResources = useMemo(() => Object.values(catalog).flat(), [catalog]);

  const openCreate = () => {
    setName('');
    setDescription('');
    setGrants({});
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (dept: Department) => {
    setName(dept.name);
    setDescription(dept.description || '');
    const map: Record<string, Grant> = {};
    for (const g of dept.permissions) {
      map[g.resource_key] = { can_create: g.can_create, can_read: g.can_read, can_update: g.can_update, can_delete: g.can_delete };
    }
    setGrants(map);
    setEditing(dept);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const toggleCell = (resourceKey: string, action: keyof Grant) => {
    setGrants((prev) => {
      const current = prev[resourceKey] || EMPTY_GRANT;
      return { ...prev, [resourceKey]: { ...current, [action]: !current[action] } };
    });
  };

  const toggleColumn = (action: keyof Grant) => {
    const allOn = allResources.every((r) => (grants[r.resource_key] || EMPTY_GRANT)[action]);
    setGrants((prev) => {
      const next = { ...prev };
      for (const r of allResources) {
        const current = next[r.resource_key] || EMPTY_GRANT;
        next[r.resource_key] = { ...current, [action]: !allOn };
      }
      return next;
    });
  };

  const onSave = async () => {
    if (!name.trim()) {
      show('Department name is required.', 'error');
      return;
    }
    setSaving(true);
    const permissions: PermissionGrant[] = Object.entries(grants).map(([resource_key, g]) => ({ resource_key, ...g }));
    try {
      if (creating) {
        await apiClient.post('/admin/departments', { name, description, permissions });
      } else if (editing) {
        await apiClient.put(`/admin/departments/${editing.id}`, { name, description, permissions });
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
          <p className="mt-1 text-xs text-faint">
            Each department grants Create/Read/Update/Delete access per resource to the admins assigned to it.
          </p>
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
                <th className="px-4 py-3">Grants</th>
                <th className="px-4 py-3">Admins</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-muted">{d.description || '—'}</td>
                  <td className="px-4 py-3 text-muted">{grantCount(d.permissions)}</td>
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
        maxWidth="max-w-3xl"
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
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <span className="mb-3 block text-xs uppercase tracking-wide text-muted">Permission matrix</span>
            <div className="max-h-96 overflow-y-auto border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-bg2">
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5">Resource</th>
                    {CRUD_ACTIONS.map((a) => (
                      <th key={a.key} className="px-3 py-2.5 text-center">
                        <button type="button" onClick={() => toggleColumn(a.key)} className="hover:text-accent">
                          {a.label}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <Fragment key={group}>
                      <tr className="bg-bg2/60">
                        <td colSpan={5} className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {group}
                        </td>
                      </tr>
                      {catalog[group].map((perm) => {
                        const g = grants[perm.resource_key] || EMPTY_GRANT;
                        return (
                          <tr key={perm.resource_key} className="border-b border-line last:border-0">
                            <td className="px-4 py-2 text-muted">{perm.label}</td>
                            {CRUD_ACTIONS.map((a) => (
                              <td key={a.key} className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={g[a.key]}
                                  onChange={() => toggleCell(perm.resource_key, a.key)}
                                  className="h-3.5 w-3.5 accent-accent"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
