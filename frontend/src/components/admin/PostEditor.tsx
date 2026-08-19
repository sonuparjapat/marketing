'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadField } from './ImageUploadField';
import { TagsInput } from './TagsInput';

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  author: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
};

const EMPTY: Omit<Post, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category: '',
  tags: [],
  author: 'Anvil Team',
  meta_title: '',
  meta_description: '',
  is_published: false,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const { show } = useToast();
  const [post, setPost] = useState<Omit<Post, 'id'>>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!postId) return;
    apiClient
      .get(`/admin/posts/${postId}`)
      .then((res) => {
        setPost(res.data.data);
        setSlugTouched(true);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const update = <K extends keyof typeof post>(key: K, value: (typeof post)[K]) => {
    setDirty(true);
    setPost((p) => {
      const next = { ...p, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value as string);
      return next;
    });
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const words = useMemo(() => post.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length, [post.content]);
  const readingTime = Math.max(1, Math.round(words / 200));

  const save = async (publish?: boolean) => {
    if (!post.title.trim()) {
      show('Give the post a title first.', 'error');
      return;
    }
    setSaving(true);
    const payload = { ...post, is_published: publish ?? post.is_published };
    try {
      if (postId) {
        await apiClient.put(`/admin/posts/${postId}`, payload);
        setPost(payload);
        show(publish === true ? 'Published.' : publish === false ? 'Unpublished.' : 'Saved.');
      } else {
        const res = await apiClient.post('/admin/posts', payload);
        show(payload.is_published ? 'Published.' : 'Draft saved.');
        router.replace(`/admin/posts/${res.data.data.id}/edit`);
        return;
      }
      setDirty(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-faint">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/posts" className="text-sm text-muted hover:text-accent">
          &larr; All posts
        </Link>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-faint">Unsaved changes</span>}
          <span
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              post.is_published ? 'bg-accent text-bg' : 'bg-bg2 text-muted'
            }`}
          >
            {post.is_published ? 'Published' : 'Draft'}
          </span>
          <button
            onClick={() => save()}
            disabled={saving}
            className="border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            onClick={() => save(!post.is_published)}
            disabled={saving}
            className="bg-accent px-5 py-2 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : post.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="min-w-0">
          <input
            type="text"
            value={post.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Post title"
            className="mb-3 w-full border-0 bg-transparent font-serif text-4xl font-normal placeholder:text-faint focus:outline-none"
          />
          <textarea
            value={post.excerpt}
            onChange={(e) => update('excerpt', e.target.value)}
            placeholder="One or two sentences that show up in previews and search results…"
            rows={2}
            className="mb-8 w-full resize-none border-0 bg-transparent text-[15px] italic text-muted placeholder:text-faint focus:outline-none"
          />
          <RichTextEditor value={post.content} onChange={(html) => update('content', html)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Publish</h3>
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Slug</span>
              <input
                type="text"
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update('slug', slugify(e.target.value));
                }}
                className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <span className="mt-1.5 block truncate text-[11px] text-faint">
                {siteUrl}/blog/{post.slug || '…'}
              </span>
            </label>
            <div className="flex items-center justify-between text-xs text-faint">
              <span>{words} words</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Cover image</h3>
            <ImageUploadField value={post.cover_image} onChange={(url) => update('cover_image', url)} />
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Organize</h3>
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Category</span>
              <input
                type="text"
                value={post.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="Strategy, SEO, Brand…"
                className="w-full border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Tags</span>
              <TagsInput value={post.tags} onChange={(tags) => update('tags', tags)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Author</span>
              <input
                type="text"
                value={post.author}
                onChange={(e) => update('author', e.target.value)}
                className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">SEO</h3>
            <label className="mb-4 block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Meta title</span>
                <span className={`text-[11px] ${post.meta_title.length > 60 ? 'text-red-400' : 'text-faint'}`}>
                  {post.meta_title.length}/60
                </span>
              </div>
              <input
                type="text"
                value={post.meta_title}
                onChange={(e) => update('meta_title', e.target.value)}
                placeholder={post.title}
                className="w-full border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
            <label className="mb-4 block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Meta description</span>
                <span className={`text-[11px] ${post.meta_description.length > 160 ? 'text-red-400' : 'text-faint'}`}>
                  {post.meta_description.length}/160
                </span>
              </div>
              <textarea
                value={post.meta_description}
                onChange={(e) => update('meta_description', e.target.value)}
                placeholder={post.excerpt}
                rows={3}
                className="w-full resize-none border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
            <div className="border border-line bg-bg p-3">
              <div className="truncate text-[13px] text-accent">
                {siteUrl}/blog/{post.slug || 'your-post'}
              </div>
              <div className="truncate text-[15px] text-[#8ab4f8]">{post.meta_title || post.title || 'Post title'}</div>
              <div className="line-clamp-2 text-[12.5px] text-muted">
                {post.meta_description || post.excerpt || 'Meta description preview…'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
