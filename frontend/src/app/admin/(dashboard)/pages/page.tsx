'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type PageRow = {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
};

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<PageRow>>({});
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    apiClient
      .get('/admin/pages', { params: { limit: 20 } })
      .then((res) => setPages(res.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  const active = pages.find((p) => p.id === activeId);

  const openEdit = (page: PageRow) => {
    setActiveId(page.id);
    setForm(page);
  };

  const onSave = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/pages/${activeId}`, {
        title: form.title,
        content: form.content,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
      });
      setPages((prev) => prev.map((p) => (p.id === activeId ? { ...p, ...form } as PageRow : p)));
      show('Page saved.');
      setActiveId(null);
    } catch {
      show('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Pages</h1>
      <p className="mb-8 text-sm text-muted">
        These pages are fixed by the site&apos;s routes — edit their content below.
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => openEdit(page)}
              className="border border-line p-5 text-left hover:border-accent"
            >
              <div className="text-[15px] font-semibold">{page.title}</div>
              <div className="text-xs text-faint">/{page.slug}</div>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-line bg-bg p-8">
            <h2 className="mb-6 font-serif text-xl">Edit {active.title}</h2>
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Title</span>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Content</span>
                <RichTextEditor value={form.content || ''} onChange={(html) => setForm((p) => ({ ...p, content: html }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Meta title (SEO)</span>
                <input
                  type="text"
                  value={form.meta_title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                  className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Meta description (SEO)</span>
                <textarea
                  rows={2}
                  value={form.meta_description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                  className="w-full resize-none border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button onClick={() => setActiveId(null)} className="px-5 py-2.5 text-sm text-muted hover:text-fg">
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="bg-accent px-6 py-2.5 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
