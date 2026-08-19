'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';

export function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onPick = async (file: File) => {
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await apiClient.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.data.url);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-bg">
            <Image src={value} alt="" fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-line text-[10px] text-faint">
            No image
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL, or upload a file"
            className="mb-2 w-full border border-line bg-bg2 px-3 py-2 text-xs focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="border border-line px-3 py-1.5 text-xs hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload file'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="border border-line px-3 py-1.5 text-xs text-red-400 hover:border-red-400"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
