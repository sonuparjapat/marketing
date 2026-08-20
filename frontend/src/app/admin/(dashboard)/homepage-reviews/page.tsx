'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionInfo } from '@/components/admin/SectionInfo';

type Review = {
  id: number;
  client_name: string;
  client_designation: string | null;
  client_company: string | null;
  client_photo: string | null;
  rating: number;
  review: string;
  home_sort_order: number | null;
};

const MAX_SELECTED = 5;

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminHomepageReviewsPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('testimonials.update');
  const { show } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/testimonials/homepage-eligible');
      setReviews(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => reviews.filter((r) => r.home_sort_order !== null).sort((a, b) => (a.home_sort_order || 0) - (b.home_sort_order || 0)),
    [reviews]
  );
  const available = useMemo(() => reviews.filter((r) => r.home_sort_order === null), [reviews]);

  // Every add/remove/reorder immediately persists — "admin should have any time right to update
  // the selection" means there's no separate Save step to forget, same as the drag-reorder pattern
  // already used on /admin/services. On failure, reload from the server so the UI never drifts from
  // what's actually live on the homepage.
  const persist = async (nextSelectedIds: number[]) => {
    setSaving(true);
    try {
      await apiClient.put('/admin/testimonials/homepage-selection', { order: nextSelectedIds });
    } catch (err) {
      show(errMessage(err, "Couldn't save the homepage selection — reloading."), 'error');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const addToHomepage = (review: Review) => {
    if (selected.length >= MAX_SELECTED) {
      show(`You can only feature ${MAX_SELECTED} reviews on the homepage at once — remove one first.`, 'error');
      return;
    }
    const nextIds = [...selected.map((r) => r.id), review.id];
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, home_sort_order: nextIds.length } : r)));
    persist(nextIds);
  };

  const removeFromHomepage = (review: Review) => {
    const nextIds = selected.filter((r) => r.id !== review.id).map((r) => r.id);
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, home_sort_order: null } : r)));
    persist(nextIds);
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...selected];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    const nextIds = reordered.map((r) => r.id);
    setReviews((prev) => {
      const order = new Map(nextIds.map((id, i) => [id, i + 1]));
      return prev.map((r) => (order.has(r.id) ? { ...r, home_sort_order: order.get(r.id)! } : r));
    });
    persist(nextIds);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Homepage Reviews</h1>
        {saving && <span className="text-xs text-faint">Saving…</span>}
      </div>
      <SectionInfo
        description={`Picks exactly which customer reviews appear in the testimonial carousel on the public homepage, and in what order. A review can be active and approved without being here — this page is the only thing that puts it in front of homepage visitors. Change the selection any time; changes go live immediately, no publish step.`}
        example={`a customer leaves a glowing 5-star review through their account. It won't show on the homepage until you drag it from "Available reviews" into "On the homepage" below — that's the deliberate step that keeps a low-effort or off-brand review from appearing without a human looking at it first.`}
      />

      {loading ? (
        <div className="border border-line">
          <TableSkeleton rows={4} cols={2} />
        </div>
      ) : !reviews.length ? (
        <EmptyState title="No approved reviews yet" description="Approve a customer review on the Testimonials page first." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.2em] text-accent">On the homepage ({selected.length}/{MAX_SELECTED})</h2>
              {canUpdate && selected.length > 1 && <span className="text-[11px] text-faint">Drag to reorder</span>}
            </div>
            {!selected.length ? (
              <p className="rounded-md border border-line-soft p-4 text-sm text-faint">
                Nothing selected — the homepage testimonial section won&apos;t render until at least one review is added.
              </p>
            ) : (
              <div className="space-y-2">
                {selected.map((r, i) => (
                  <div
                    key={r.id}
                    draggable={canUpdate}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(i)}
                    className={`flex items-start gap-3 rounded-lg border border-line bg-bg2 p-4 ${dragIndex === i ? 'opacity-40' : ''}`}
                  >
                    {canUpdate && (
                      <span className="cursor-grab pt-0.5 text-faint active:cursor-grabbing" title="Drag to reorder">
                        ⠿
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.client_name}</span>
                        <span className="text-xs text-faint">{'★'.repeat(r.rating)}</span>
                      </div>
                      {(r.client_designation || r.client_company) && (
                        <p className="text-xs text-faint">
                          {[r.client_designation, r.client_company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{r.review}</p>
                    </div>
                    {canUpdate && (
                      <button onClick={() => removeFromHomepage(r)} className="shrink-0 text-xs text-red-400 hover:opacity-80">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Available reviews</h2>
            {!available.length ? (
              <p className="rounded-md border border-line-soft p-4 text-sm text-faint">
                Every approved review is already on the homepage.
              </p>
            ) : (
              <div className="space-y-2">
                {available.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-lg border border-line-soft p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.client_name}</span>
                        <span className="text-xs text-faint">{'★'.repeat(r.rating)}</span>
                      </div>
                      {(r.client_designation || r.client_company) && (
                        <p className="text-xs text-faint">
                          {[r.client_designation, r.client_company].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{r.review}</p>
                    </div>
                    {canUpdate && (
                      <button
                        onClick={() => addToHomepage(r)}
                        disabled={selected.length >= MAX_SELECTED}
                        className="shrink-0 text-xs text-accent hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
