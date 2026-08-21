'use client';

import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';

type DocumentRow = {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_name: string | null;
  created_at: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Embedded in Client and Project detail pages — not a standalone admin page. Uploads PDFs/Office
// files (contracts, briefs, etc.) attached to whichever entity it's rendered on.
export function DocumentsPanel({
  entityType,
  entityId,
  canUpload,
  canDelete,
}: {
  entityType: 'client' | 'project';
  entityId: number;
  canUpload: boolean;
  canDelete: boolean;
}) {
  const { show } = useToast();
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/documents', { params: { entity_type: entityType, entity_id: entityId } });
      setDocs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const onUpload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('entity_type', entityType);
    form.append('entity_id', String(entityId));
    try {
      await apiClient.post('/admin/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
      show('Uploaded.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (doc: DocumentRow) => {
    if (!confirm(`Delete "${doc.filename}"? This can't be undone.`)) return;
    await apiClient.delete(`/admin/documents/${doc.id}`);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    show('Document deleted.');
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Documents</h2>
        {canUpload && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-accent hover:opacity-80 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : '+ Upload'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-faint">Loading…</p>
      ) : !docs.length ? (
        <p className="text-sm text-faint">No documents yet — contracts, briefs, or anything else worth keeping on record.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-line-soft p-3 text-sm">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-medium hover:text-accent">
                {doc.filename}
              </a>
              <div className="flex shrink-0 items-center gap-3 text-xs text-faint">
                <span>{formatSize(doc.size_bytes)}</span>
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                {canDelete && (
                  <button onClick={() => onDelete(doc)} className="text-red-400 hover:opacity-80">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
