'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const PAGE_SIZE = 20;

type Comment = {
  id: number;
  content: string;
  created_at: string;
  post_title: string;
  post_slug: string;
  customer_name: string;
  customer_email: string;
};

export default function AdminCommentsPage() {
  const { hasPermission } = useAdminAuth();
  const canDelete = hasPermission('comments.delete');
  const { show } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/comments', { params: { page: targetPage, limit: PAGE_SIZE } });
      setComments(res.data.data.items);
      setTotal(res.data.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const onDelete = async (comment: Comment) => {
    if (!confirm('Delete this comment? This can\'t be undone.')) return;
    await apiClient.delete(`/admin/comments/${comment.id}`);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    setTotal((t) => t - 1);
    show('Comment deleted.');
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Comments</h1>

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={6} cols={4} />
        </div>
      ) : !comments.length ? (
        <EmptyState title="No comments yet" description="Comments left on blog posts appear here." />
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="border border-line p-5">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <span className="font-medium">{c.customer_name}</span>
                  <span className="ml-2 text-xs text-faint">{c.customer_email}</span>
                </div>
                {canDelete && (
                  <button onClick={() => onDelete(c)} className="shrink-0 text-xs text-red-400 hover:opacity-80">
                    Delete
                  </button>
                )}
              </div>
              <p className="mb-3 text-sm text-fg/90">{c.content}</p>
              <div className="flex items-center gap-3 text-xs text-faint">
                <Link href={`/blog/${c.post_slug}`} target="_blank" className="text-accent hover:opacity-80">
                  {c.post_title}
                </Link>
                <span>&middot;</span>
                <span>{new Date(c.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </div>
  );
}
