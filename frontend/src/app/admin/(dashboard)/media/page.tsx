'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Skeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 30;

type MediaItem = {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export default function AdminMediaPage() {
  const { hasPermission } = useAdminAuth();
  const canCreate = hasPermission('media.create');
  const canDelete = hasPermission('media.delete');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inputRef = useRef<HTMLInputElement>(null);
  const { show } = useToast();

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/media', { params: { page: targetPage, limit: PAGE_SIZE } });
      setItems(res.data.data.items);
      setTotal(res.data.data.total ?? res.data.data.items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const onUpload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      await apiClient.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPage(1);
      await load(1);
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

  const onDelete = async (item: MediaItem) => {
    if (!confirm('Delete this file? Anything still referencing its URL will show a broken image.')) return;
    await apiClient.delete(`/admin/media/${item.id}`);
    const targetPage = items.length === 1 && page > 1 ? page - 1 : page;
    if (targetPage !== page) setPage(targetPage);
    await load(targetPage);
    show('Deleted.');
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    show('URL copied.');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Media Library</h1>
        {canCreate && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-accent px-5 py-2.5 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : '+ Upload'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-faint">No files uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative border border-line">
              <div className="relative aspect-square bg-bg2">
                <Image src={item.url} alt={item.filename} fill className="object-cover" sizes="200px" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <button onClick={() => copyUrl(item.url)} className="truncate text-[11px] text-muted hover:text-accent">
                  {item.filename}
                </button>
                {canDelete && (
                  <button onClick={() => onDelete(item)} className="text-[11px] text-red-400 hover:opacity-80">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </div>
  );
}
