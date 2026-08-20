'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SectionInfo } from '@/components/admin/SectionInfo';

type Banner = {
  id: number;
  tag_label: string | null;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_label: string | null;
  button_link: string | null;
  placement: 'hero' | 'promo';
  sort_order: number;
  is_active: boolean;
};

const EMPTY: Omit<Banner, 'id'> = {
  tag_label: '',
  title: '',
  subtitle: '',
  image_url: '',
  button_label: '',
  button_link: '',
  placement: 'hero',
  sort_order: 0,
  is_active: true,
};

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminBannersPage() {
  const { hasPermission } = useAdminAuth();
  const canCreate = hasPermission('banners.create');
  const canUpdate = hasPermission('banners.update');
  const canDelete = hasPermission('banners.delete');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Banner, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/banners', { params: { limit: 100 } });
      setBanners(res.data.data.items);
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

  const openEdit = (b: Banner) => {
    setForm(b);
    setEditing(b);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const onSave = async () => {
    if (!form.title || !form.image_url) {
      show('Title and image are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (creating) {
        await apiClient.post('/admin/banners', form);
      } else if (editing) {
        await apiClient.put(`/admin/banners/${editing.id}`, form);
      }
      close();
      await load();
      show('Banner saved.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (b: Banner) => {
    if (!confirm(`Delete "${b.title}"? This can't be undone.`)) return;
    await apiClient.delete(`/admin/banners/${b.id}`);
    await load();
    show('Banner deleted.');
  };

  const onDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setBanners(reordered);

    const order = reordered.map((b, i) => ({ id: b.id, sort_order: i }));
    try {
      await apiClient.patch('/admin/banners/reorder', { order });
    } catch {
      show('Failed to save the new order — reloading.', 'error');
      await load();
    }
  };

  const hasRowActions = canUpdate || canDelete;
  const modalOpen = creating || editing !== null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Banners</h1>
        {canCreate && <Button onClick={openCreate}>+ New</Button>}
      </div>
      <SectionInfo
        description={`Manages the auto-rotating banner slider between the hero headline and the logo strip on the homepage. ${canUpdate ? 'Drag rows to reorder — that order is the rotation order.' : ''} With zero active "hero" banners, the slider section doesn't render at all — the homepage falls back to the plain branded hero copy underneath it.`}
        example={`you just published a big case study and want to promote it. You add a banner with an image, a "Read the story" button linking to /work/that-case-study, placement "Homepage hero rotation", turn it Active — it starts rotating into view on the next homepage load.`}
      />

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : !banners.length ? (
        <EmptyState title="Nothing here yet" description={canCreate ? 'Add the first banner to get started.' : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                {canUpdate && <th className="w-8 px-2 py-3" />}
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Placement</th>
                <th className="px-4 py-3">Active</th>
                {hasRowActions && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {banners.map((b, i) => (
                <tr
                  key={b.id}
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
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-16 overflow-hidden border border-line bg-bg">
                      {b.image_url && <Image src={b.image_url} alt="" fill className="object-cover" sizes="64px" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{b.title}</td>
                  <td className="px-4 py-3 text-muted capitalize">{b.placement}</td>
                  <td className="px-4 py-3 text-muted">{b.is_active ? 'Yes' : 'Hidden'}</td>
                  {hasRowActions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {canUpdate && (
                        <button onClick={() => openEdit(b)} className="mr-4 text-accent hover:opacity-80">
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(b)} className="text-red-400 hover:opacity-80">
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
        title={creating ? 'New Banner' : `Edit ${editing?.title}`}
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
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
              Image
              <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                The full-width banner background — a wide, landscape image works best (it&apos;s cropped to the slider&apos;s aspect ratio).
              </span>
            </span>
            <ImageUploadField value={form.image_url} onChange={(url) => setForm((p) => ({ ...p, image_url: url }))} />
          </label>
          <Input
            label="Tag label (optional)"
            help="A small pill/eyebrow shown above the title, e.g. to flag what kind of banner this is."
            value={form.tag_label || ''}
            onChange={(e) => setForm((p) => ({ ...p, tag_label: e.target.value }))}
            placeholder="e.g. Case Study · Q4 Results"
          />
          <Input
            label="Title"
            help="The large headline text overlaid on the banner image."
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <Textarea
            label="Subtitle (optional)"
            help="Smaller supporting text shown under the title."
            rows={2}
            value={form.subtitle || ''}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Button label (optional)"
              help="Text on the call-to-action button. Leave both button fields empty for a banner with no button."
              value={form.button_label || ''}
              onChange={(e) => setForm((p) => ({ ...p, button_label: e.target.value }))}
              placeholder="Read the story"
            />
            <Input
              label="Button link (optional)"
              help="Where the button goes — an internal path like /work/slug, or a full https:// URL."
              value={form.button_link || ''}
              onChange={(e) => setForm((p) => ({ ...p, button_link: e.target.value }))}
              placeholder="/work/some-case-study"
            />
          </div>
          <Select
            label="Placement"
            help="Which section of the homepage this banner can rotate into."
            value={form.placement}
            onChange={(e) => setForm((p) => ({ ...p, placement: e.target.value as 'hero' | 'promo' }))}
          >
            <option value="hero">Homepage hero rotation</option>
            <option value="promo">Promo strip</option>
          </Select>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>
              <span className="block text-sm">Active (visible on site)</span>
              <span className="mt-0.5 block text-[11px] text-faint">Off removes it from the rotation without deleting it — handy for pausing a seasonal banner.</span>
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
