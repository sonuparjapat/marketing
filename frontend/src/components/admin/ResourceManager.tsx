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
import { Pagination } from '@/components/ui/Pagination';
import { SectionInfo } from './SectionInfo';

export type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'boolean' | 'number' | 'string-array' | 'json' | 'select';

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  // One concrete sentence on what this specific field controls and where it shows up — e.g.
  // "Shown as the card title on /services and in the nav dropdown." Optional but every field on
  // every admin page should have one; see the standing project instruction this implements.
  help?: string;
};

export type ColumnConfig<T> = { key: string; label: string; render?: (row: T) => ReactNode };

type Row = Record<string, unknown> & { id: number };

export function ResourceManager<T extends Row>({
  title,
  description,
  example,
  apiPath,
  columns,
  fields,
  emptyItem,
  hideDelete,
}: {
  title: string;
  // What this resource IS and what real-world thing changes when you edit it — shown as a banner
  // above the table via SectionInfo, so someone new to the panel doesn't have to guess.
  description: string;
  example?: string;
  apiPath: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  emptyItem: Record<string, unknown>;
  // No DELETE route exists for this resource at all (e.g. premium_services, subscription_plans —
  // see the plan doc: hard delete is deliberately not exposed since it would orphan subscriber/
  // payment history). Forces the Delete button off regardless of what a department's permission
  // grants say, so a granted-but-nonexistent `.delete` permission can never surface a dead button.
  hideDelete?: boolean;
}) {
  const PAGE_SIZE = 20;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const resource = apiPath.replace(/^\/admin\//, '').replace(/-/g, '_');
  const canCreate = hasPermission(`${resource}.create`);
  const canEdit = hasPermission(`${resource}.update`);
  const canDelete = !hideDelete && hasPermission(`${resource}.delete`);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get(apiPath, { params: { page: targetPage, limit: PAGE_SIZE } });
      setItems(res.data.data.items);
      setTotal(res.data.data.total ?? res.data.data.items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  useEffect(() => {
    // page 1 is already fetched by the apiPath effect above — avoid double-fetching it.
    if (page === 1) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
      // A new item goes on page 1 by insertion order in most resources; an edit doesn't move pages.
      await load(creating ? 1 : page);
      if (creating) setPage(1);
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
    // If that was the last item on this page (and it's not page 1), step back a page rather than
    // showing an empty page.
    const targetPage = items.length === 1 && page > 1 ? page - 1 : page;
    if (targetPage !== page) setPage(targetPage);
    await load(targetPage);
    show(`${title} deleted.`);
  };

  const modalOpen = creating || editing !== null;
  const hasRowActions = canEdit || canDelete;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">{title}</h1>
        {canCreate && <Button onClick={openCreate}>+ New</Button>}
      </div>
      <SectionInfo description={description} example={example} />

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

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

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
    <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
      {field.label}
      {field.help && <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">{field.help}</span>}
    </span>
  );

  if (field.type === 'boolean') {
    return (
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          <span className="block text-sm">{field.label}</span>
          {field.help && <span className="mt-0.5 block text-[11px] text-faint">{field.help}</span>}
        </span>
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
