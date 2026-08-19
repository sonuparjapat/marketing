'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { TagsInput } from '@/components/admin/TagsInput';

type Service = {
  id: number;
  title: string;
  short_description: string;
  full_description: string;
  icon: string;
  features_json: string[];
  sort_order: number;
  is_active: boolean;
};

const ICONS = ['target', 'search', 'sparkles', 'layout', 'workflow', 'users'];

const EMPTY: Omit<Service, 'id'> = {
  title: '',
  short_description: '',
  full_description: '',
  icon: 'target',
  features_json: [],
  sort_order: 0,
  is_active: true,
};

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminServicesPage() {
  const { hasPermission } = useAdminAuth();
  const canCreate = hasPermission('services.create');
  const canUpdate = hasPermission('services.update');
  const canDelete = hasPermission('services.delete');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/services', { params: { limit: 100 } });
      setServices(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (s: Service) => {
    setForm(s);
    setEditing(s);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (creating) {
        await apiClient.post('/admin/services', form);
      } else if (editing) {
        await apiClient.put(`/admin/services/${editing.id}`, form);
      }
      close();
      await load();
      show('Service saved.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (s: Service) => {
    if (!confirm(`Delete "${s.title}"? This can't be undone.`)) return;
    await apiClient.delete(`/admin/services/${s.id}`);
    await load();
    show('Service deleted.');
  };

  const onDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...services];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setServices(reordered);

    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
    try {
      await apiClient.patch('/admin/services/reorder', { order });
    } catch {
      show('Failed to save the new order — reloading.', 'error');
      await load();
    }
  };

  const hasRowActions = canUpdate || canDelete;
  const modalOpen = creating || editing !== null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Services</h1>
          {canUpdate && <p className="mt-1 text-xs text-faint">Drag rows to reorder — this is the order shown on the site.</p>}
        </div>
        {canCreate && <Button onClick={openCreate}>+ New</Button>}
      </div>

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={5} cols={3} />
        </div>
      ) : !services.length ? (
        <EmptyState title="Nothing here yet" description={canCreate ? 'Create the first service to get started.' : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                {canUpdate && <th className="w-8 px-2 py-3" />}
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                {hasRowActions && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr
                  key={s.id}
                  draggable={canUpdate}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(i)}
                  className={`border-b border-line last:border-0 ${dragIndex === i ? 'opacity-40' : ''}`}
                >
                  {canUpdate && (
                    <td className="cursor-grab px-2 py-3 text-center text-faint active:cursor-grabbing" title="Drag to reorder">
                      ⠿
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-muted">{s.sort_order}</td>
                  <td className="px-4 py-3 text-muted">{s.is_active ? 'Yes' : 'Hidden'}</td>
                  {hasRowActions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {canUpdate && (
                        <button onClick={() => openEdit(s)} className="mr-4 text-accent hover:opacity-80">
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(s)} className="text-red-400 hover:opacity-80">
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={close}
        title={creating ? 'New Service' : `Edit ${editing?.title}`}
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
          <Input label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Textarea
            label="Short description"
            rows={3}
            value={form.short_description}
            onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
          />
          <Textarea
            label="Full description"
            rows={4}
            value={form.full_description}
            onChange={(e) => setForm((p) => ({ ...p, full_description: e.target.value }))}
          />
          <Select label="Icon" value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}>
            {ICONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Features</span>
            <TagsInput value={form.features_json} onChange={(tags) => setForm((p) => ({ ...p, features_json: tags }))} />
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm">Active (visible on site)</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
