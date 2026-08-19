'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';

type PostRow = {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  category: string;
  views: number;
  is_published: boolean;
  updated_at: string;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { show } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/posts', { params: { limit: 100 } });
      setPosts(res.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => [...new Set(posts.map((p) => p.category).filter(Boolean))], [posts]);

  const filtered = posts.filter((p) => {
    if (category && p.category !== category) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const togglePublish = async (post: PostRow) => {
    const next = !post.is_published;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: next } : p)));
    try {
      await apiClient.put(`/admin/posts/${post.id}`, { is_published: next });
      show(next ? 'Published.' : 'Unpublished.');
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: !next } : p)));
      show('Something went wrong.', 'error');
    }
  };

  const onDelete = async (post: PostRow) => {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    await apiClient.delete(`/admin/posts/${post.id}`);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    show('Post deleted.');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Blog Posts</h1>
        <Link href="/admin/posts/new" className="bg-accent px-5 py-2.5 text-sm font-bold text-bg hover:opacity-90">
          + New post
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts…"
          className="w-56 border border-line bg-bg2 px-3.5 py-2.5 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${post.id}/edit`} className="flex items-center gap-3">
                      <div className="relative h-10 w-14 shrink-0 overflow-hidden border border-line bg-bg2">
                        {post.cover_image && <Image src={post.cover_image} alt="" fill className="object-cover" sizes="56px" />}
                      </div>
                      <span className="font-medium hover:text-accent">{post.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{post.category || '—'}</td>
                  <td className="px-4 py-3 text-muted">{post.views}</td>
                  <td className="px-4 py-3 text-muted">{new Date(post.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        post.is_published ? 'bg-accent text-bg' : 'bg-bg2 text-muted'
                      }`}
                    >
                      {post.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/admin/posts/${post.id}/edit`} className="mr-4 text-accent hover:opacity-80">
                      Edit
                    </Link>
                    <button onClick={() => onDelete(post)} className="text-red-400 hover:opacity-80">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-faint">
                    {posts.length ? 'No posts match your filters.' : 'No posts yet — write your first one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
