'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { SectionInfo } from '@/components/admin/SectionInfo';

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
  const [search, setSearch] = useState('');
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

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    const filtered: PermissionCatalog = {};
    for (const [group, perms] of Object.entries(catalog)) {
      const matches = perms.filter((p) => p.label.toLowerCase().includes(q) || group.toLowerCase().includes(q));
      if (matches.length) filtered[group] = matches;
    }
    return filtered;
  }, [catalog, search]);

  const groups = useMemo(() => Object.keys(filteredCatalog), [filteredCatalog]);
  const visibleResources = useMemo(() => Object.values(filteredCatalog).flat(), [filteredCatalog]);

  const openCreate = () => {
    setName('');
    setDescription('');
    setGrants({});
    setSearch('');
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
    setSearch('');
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
    const allOn = visibleResources.every((r) => (grants[r.resource_key] || EMPTY_GRANT)[action]);
    setGrants((prev) => {
      const next = { ...prev };
      for (const r of visibleResources) {
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
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Departments</h1>
        <Button onClick={openCreate}>+ New department</Button>
      </div>
      <SectionInfo
        description="A department is a reusable permission bundle — a named set of Create/Read/Update/Delete grants across every admin resource. Editors don't get permissions individually; they inherit whatever their assigned department grants, so editing a department instantly reshapes access for everyone in it."
        example={`you want a "Support" role that can read and reply to tickets and view customers, but touch nothing else. You create a "Support" department, check Read+Update on Support Tickets and Read on Customers only, leave everything else unchecked — any admin assigned to it can now do exactly that and nothing more.`}
      />

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
          <Input label="Name" help="Internal label only — shown in the Admins page's Department dropdown, never visible outside this panel." value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Description" help="A short note on who this department is for — helps whoever's assigning admins later remember the intent." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="block text-xs uppercase tracking-wide text-muted">
                Permission matrix
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  One row per admin resource. Check a box to grant that action; click a column header to toggle it for every visible row at once.
                </span>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources…"
                className="w-48 border border-line bg-bg2 px-3 py-1.5 text-xs placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </div>
            <div className="max-h-96 overflow-y-auto border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-bg2">
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5">Resource</th>
                    {CRUD_ACTIONS.map((a) => {
                      const checkedCount = visibleResources.filter((r) => (grants[r.resource_key] || EMPTY_GRANT)[a.key]).length;
                      const allChecked = visibleResources.length > 0 && checkedCount === visibleResources.length;
                      const someChecked = checkedCount > 0 && !allChecked;
                      return (
                        <th key={a.key} className="px-3 py-2.5 text-center">
                          <label className="flex flex-col items-center gap-1 hover:text-accent">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = someChecked;
                              }}
                              onChange={() => toggleColumn(a.key)}
                              disabled={visibleResources.length === 0}
                              className="h-3.5 w-3.5 accent-accent"
                            />
                            {a.label}
                          </label>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-faint">
                        No resources match &ldquo;{search}&rdquo;.
                      </td>
                    </tr>
                  )}
                  {groups.map((group) => (
                    <Fragment key={group}>
                      <tr className="bg-bg2/60">
                        <td colSpan={5} className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {group}
                        </td>
                      </tr>
                      {filteredCatalog[group].map((perm) => {
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
