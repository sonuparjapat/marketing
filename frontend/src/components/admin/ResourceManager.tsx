'use client';

import { useEffect, useState, type ReactNode } from 'react';
import apiClient from '@/lib/apiClient';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadField } from './ImageUploadField';
import { useToast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeleton';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'boolean' | 'number' | 'string-array' | 'json' | 'select';

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
};

export type ColumnConfig<T> = { key: string; label: string; render?: (row: T) => ReactNode };

type Row = Record<string, unknown> & { id: number };

export function ResourceManager<T extends Row>({
  title,
  apiPath,
  columns,
  fields,
  emptyItem,
}: {
  title: string;
  apiPath: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  emptyItem: Record<string, unknown>;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const resource = apiPath.replace(/^\/admin\//, '').replace(/-/g, '_');
  const canCreate = hasPermission(`${resource}.create`);
  const canEdit = hasPermission(`${resource}.edit`);
  const canDelete = hasPermission(`${resource}.delete`);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(apiPath, { params: { limit: 100 } });
      setItems(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  const openCreate = () => {
    setForm(emptyItem);
    setCreating(true);
    setEditing(null);
    setError('');
  };

  const openEdit = (row: T) => {
    setForm(row);
    setEditing(row);
    setCreating(false);
    setError('');
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const serialize = () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const value = form[f.name];
      if (f.type === 'string-array') {
        payload[f.name] = typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value || [];
      } else if (f.type === 'json') {
        if (typeof value === 'string') {
          payload[f.name] = value.trim() ? JSON.parse(value) : [];
        } else {
          payload[f.name] = value ?? [];
        }
      } else if (f.type === 'number') {
        payload[f.name] = value === '' || value === undefined ? 0 : Number(value);
      } else {
        payload[f.name] = value;
      }
    }
    return payload;
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = serialize();
      if (creating) {
        await apiClient.post(apiPath, payload);
      } else if (editing) {
        await apiClient.put(`${apiPath}/${editing.id}`, payload);
      }
      close();
      await load();
      show(`${title} saved.`);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Something went wrong.');
      show(message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: T) => {
    if (!confirm(`Delete this ${title.toLowerCase()}? This can't be undone.`)) return;
    await apiClient.delete(`${apiPath}/${row.id}`);
    await load();
    show(`${title} deleted.`);
  };

  const modalOpen = creating || editing !== null;
  const hasRowActions = canEdit || canDelete;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">{title}</h1>
        {canCreate && <Button onClick={openCreate}>+ New</Button>}
      </div>

      {loading && !items.length ? (
        <div className="border border-line">
          <TableSkeleton rows={5} cols={columns.length} />
        </div>
      ) : !items.length ? (
        <EmptyState title="Nothing here yet" description={canCreate ? `Create the first ${title.toLowerCase()} to get started.` : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">
                    {c.label}
                  </th>
                ))}
                {hasRowActions && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.render ? c.render(row) : String(row[c.key] ?? '')}
                    </td>
                  ))}
                  {hasRowActions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {canEdit && (
                        <button onClick={() => openEdit(row)} className="mr-4 text-accent hover:opacity-80">
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(row)} className="text-red-400 hover:opacity-80">
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
        title={creating ? `New ${title}` : `Edit ${title}`}
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
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => setForm((p) => ({ ...p, [f.name]: v }))} />
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Modal>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="mb-2 block text-xs uppercase tracking-wide text-muted">{field.label}</span>
  );

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-accent" />
        <span className="text-sm">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <label className="block">
        {label}
        <textarea
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full resize-none border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </label>
    );
  }

  if (field.type === 'image') {
    return (
      <label className="block">
        {label}
        <ImageUploadField value={typeof value === 'string' ? value : ''} onChange={onChange} />
      </label>
    );
  }

  if (field.type === 'richtext') {
    return (
      <label className="block">
        {label}
        <RichTextEditor value={typeof value === 'string' ? value : ''} onChange={onChange} />
      </label>
    );
  }

  if (field.type === 'json') {
    const display = typeof value === 'string' ? value : JSON.stringify(value ?? [], null, 2);
    return (
      <label className="block">
        {label}
        <textarea
          rows={6}
          defaultValue={display}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '[{"metric":"Revenue","value":"+200%","label":"12mo"}]'}
          className="w-full resize-none border border-line bg-bg2 px-3.5 py-2.5 font-mono text-xs focus:border-accent focus:outline-none"
        />
      </label>
    );
  }

  if (field.type === 'string-array') {
    const display = Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
    return (
      <label className="block">
        {label}
        <input
          type="text"
          value={display}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Comma-separated (e.g. Meta Ads, Google Ads)"
          className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        {label}
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
        >
          {(field.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      {label}
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
