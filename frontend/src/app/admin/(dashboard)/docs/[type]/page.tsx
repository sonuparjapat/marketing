'use client';

import { use, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { extractHeadings } from '@/lib/toc';

type Doc = { doc_type: string; title: string; content: string; updated_at: string };

export default function AdminDocPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">{doc.title}</h1>
          <p className="mt-1 text-xs text-faint">Last updated {new Date(doc.updated_at).toLocaleString()}</p>
        </div>
        {editing ? (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDraft(doc.content);
                setEditing(false);
              }}
              className="px-4 py-2 text-sm text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="bg-accent px-5 py-2 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <RichTextEditor value={draft} onChange={setDraft} placeholder="Start writing…" />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <div className="prose max-w-none border border-line bg-bg2 px-8 py-8" dangerouslySetInnerHTML={{ __html: html || '<p class="text-faint">Nothing written yet — click Edit to get started.</p>' }} />
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
