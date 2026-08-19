'use client';

import { use, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { extractHeadings } from '@/lib/toc';

type Doc = { doc_type: string; title: string; content: string; updated_at: string };

const DOC_TYPES: { type: string; title: string }[] = [
  { type: 'user-manual', title: 'User Manual' },
  { type: 'testing', title: 'Testing Guide' },
  { type: 'developer', title: 'Developer Docs' },
];

function downloadHtml(filename: string, title: string, bodyHtml: string) {
  const full = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${bodyHtml}</body></html>`;
  const blob = new Blob([full], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDocPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/admin/docs/${type}`)
      .then((res) => {
        setDoc(res.data.data);
        setDraft(res.data.data.content);
      })
      .finally(() => setLoading(false));
  }, [type]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/docs/${type}`, { content: draft });
      setDoc(res.data.data);
      setEditing(false);
      show('Saved.');
    } catch {
      show('Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/docs/${type}`;
    await navigator.clipboard.writeText(link);
    show('Public link copied — anyone with it can view this doc.');
  };

  const downloadThis = () => {
    if (!doc) return;
    downloadHtml(`${doc.doc_type}.html`, doc.title, doc.content);
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      const docs = await Promise.all(
        DOC_TYPES.map((d) => apiClient.get(`/admin/docs/${d.type}`).then((res) => res.data.data as Doc))
      );
      const combined = docs
        .map((d) => `<h1>${d.title}</h1><p><em>Last updated ${new Date(d.updated_at).toLocaleDateString()}</em></p>${d.content}<hr/>`)
        .join('\n');
      downloadHtml('all-docs.html', 'All Documentation', combined);
      show('All docs downloaded.');
    } catch {
      show('Something went wrong.', 'error');
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!doc) return <p className="text-sm text-faint">Doc not found.</p>;

  const { html, headings } = extractHeadings(doc.content);
  const canEdit = hasPermission('docs.edit');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">{doc.title}</h1>
          <p className="mt-1 text-xs text-faint">Last updated {new Date(doc.updated_at).toLocaleString()}</p>
        </div>
        {editing ? (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(doc.content);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={copyShareLink}>
              Copy public link
            </Button>
            <Button variant="secondary" onClick={downloadThis}>
              Download this doc
            </Button>
            <Button variant="secondary" onClick={downloadAll} loading={downloadingAll}>
              Download all docs
            </Button>
            {canEdit && <Button onClick={() => setEditing(true)}>Edit</Button>}
          </div>
        )}
      </div>

      {editing ? (
        <RichTextEditor value={draft} onChange={setDraft} placeholder="Start writing…" />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <div
            className="prose max-w-none border border-line bg-bg2 px-8 py-8"
            dangerouslySetInnerHTML={{ __html: html || '<p class="text-faint">Nothing written yet — click Edit to get started.</p>' }}
          />
          {headings.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-8 border-l border-line pl-6">
                <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">On this page</div>
                <nav className="space-y-2.5 text-[13px]">
                  {headings.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className={`block text-muted hover:text-accent ${h.level === 3 ? 'pl-3' : ''}`}>
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
