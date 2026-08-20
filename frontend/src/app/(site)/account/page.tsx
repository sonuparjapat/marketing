'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import customerApiClient from '@/lib/customerApiClient';
import { clearCustomerSession } from '@/lib/customerAuth';

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

type Tab = 'overview' | 'premium' | 'reviews' | 'support' | 'settings';
type Stats = { comment_count: number; review_count: number; ticket_count: number };
type Subscription = {
  id: number;
  plan_name: string;
  started_at: string;
  expires_at: string;
  status: 'active' | 'cancelled' | 'refunded';
  is_currently_active: boolean;
};

const STAT_ICONS: Record<'gold' | 'emerald' | 'coral', ReactNode> = {
  gold: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 11.5a8.5 8.5 0 01-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1121 11.5z" />
    </svg>
  ),
  emerald: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  ),
  coral: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 8l9-5 9 5v8l-9 5-9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
};

function StatTile({
  hue,
  label,
  value,
  onClick,
}: {
  hue: 'gold' | 'emerald' | 'coral';
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass group flex flex-1 items-center gap-4 rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:border-accent/35"
    >
      <div className={`icon-badge ${hue} h-11! w-11!`}>{STAT_ICONS[hue]}</div>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted">{label}</div>
      </div>
    </button>
  );
}

export default function AccountPage() {
  const { customer, loading, logout, updateProfile } = useCustomerAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);

  // Profile edit
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Reviews
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  // Export / delete
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer) return;
    customerApiClient
      .get('/auth/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => {});
    customerApiClient
      .get('/subscriptions/me')
      .then((res) => setSubscriptions(res.data.data))
      .catch(() => {});
  }, [customer]);

  const startEditName = () => {
    setNameDraft(customer?.name || '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameDraft.trim()) return;
    setSavingName(true);
    const result = await updateProfile(nameDraft.trim());
    setSavingName(false);
    if (result.success) setEditingName(false);
  };

  const onSubmitReview = async () => {
    if (!review.trim()) return;
    setSubmittingReview(true);
    try {
      await customerApiClient.post('/testimonials', { rating, review });
      setReviewDone(true);
      setReview('');
      setStats((s) => (s ? { ...s, review_count: s.review_count + 1 } : s));
    } catch (err) {
      setError(errMessage(err, 'Could not submit your review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await customerApiClient.get('/auth/export');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-account-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errMessage(err, 'Could not export your data.'));
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await customerApiClient.delete('/auth/me');
      clearCustomerSession();
      router.push('/');
    } catch (err) {
      setError(errMessage(err, 'Could not delete your account.'));
      setDeleting(false);
    }
  };

  if (loading) return null;

  if (!customer) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-muted">Sign in from the account icon in the navbar to view your account.</p>
      </main>
    );
  }

  const memberSince = new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[900px]">
        {/* Profile header */}
        <div className="glass glass-border-grad relative mb-8 overflow-hidden rounded-2xl p-8 md:p-10">
          <div
            className="animate-drift pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-[100px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="icon-badge gold h-20! w-20! shrink-0 rounded-full! text-2xl">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="mb-2 flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    className="rounded-lg border border-line-soft bg-bg2 px-3 py-1.5 font-serif text-2xl focus:border-accent focus:outline-none"
                  />
                  <button onClick={saveName} disabled={savingName} className="text-xs text-accent hover:opacity-80">
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-xs text-muted hover:text-fg">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="font-serif text-3xl font-normal">{customer.name}</h1>
                  <button onClick={startEditName} aria-label="Edit name" className="text-faint hover:text-accent">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
                    </svg>
                  </button>
                </div>
              )}
              <p className="text-sm text-muted">{customer.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-line-soft px-3 py-1 text-[11px] text-faint">Member since {memberSince}</span>
                {customer.is_premium && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] text-accent">Premium</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <StatTile hue="gold" label="Comments posted" value={stats.comment_count} onClick={() => setTab('overview')} />
            <StatTile hue="emerald" label="Reviews submitted" value={stats.review_count} onClick={() => setTab('reviews')} />
            <StatTile hue="coral" label="Support tickets" value={stats.ticket_count} onClick={() => setTab('support')} />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-full border border-line-soft p-1 text-sm">
          {([
            ['overview', 'Overview'],
            ['premium', 'Premium'],
            ['reviews', 'Reviews'],
            ['support', 'Support'],
            ['settings', 'Settings'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full px-5 py-2.5 transition-colors ${
                tab === key ? 'bg-accent font-bold text-bg' : 'text-muted hover:text-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="glass rounded-2xl p-8">
            <h2 className="mb-2 font-serif text-xl">Welcome back, {customer.name.split(' ')[0]}.</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">
              Everything you do on the site — comments on posts, reviews, and support conversations — is tracked here.
              Use the tabs above to manage them, or the Settings tab for your account itself.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/blog" className="rounded-lg border border-line-soft px-5 py-2.5 text-sm hover:border-accent hover:text-accent">
                Browse the blog
              </Link>
              <Link href="/account/support" className="rounded-lg border border-line-soft px-5 py-2.5 text-sm hover:border-accent hover:text-accent">
                Open support tickets
              </Link>
            </div>
          </div>
        )}

        {tab === 'premium' && (
          <div className="glass rounded-2xl p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="mb-1 font-serif text-xl">Your subscriptions</h2>
                <p className="text-sm text-muted">Every plan you&apos;ve purchased, active or expired.</p>
              </div>
              <Link
                href="/premium"
                className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5"
              >
                View plans
              </Link>
            </div>
            {!subscriptions?.length ? (
              <p className="text-sm text-faint">No subscriptions yet.</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-soft px-5 py-4"
                  >
                    <div>
                      <div className="font-semibold">{s.plan_name}</div>
                      <div className="text-xs text-faint">
                        {new Date(s.started_at).toLocaleDateString('en-IN')} &rarr; {new Date(s.expires_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        s.is_currently_active
                          ? 'border border-accent/40 bg-accent/10 text-accent'
                          : 'border border-line-soft text-faint'
                      }`}
                    >
                      {s.is_currently_active ? 'Active' : s.status === 'refunded' ? 'Refunded' : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="glass rounded-2xl p-8">
            <h2 className="mb-1 font-serif text-xl">Leave a review</h2>
            <p className="mb-6 text-sm text-muted">Submitted reviews are checked before they go live on the site.</p>
            {reviewDone ? (
              <p className="text-sm text-accent">Thanks — your review is pending approval.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      aria-label={`${n} stars`}
                      className={`text-2xl transition-colors ${n <= rating ? 'text-accent' : 'text-line'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Tell us about your experience…"
                  className="w-full resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
                />
                <button
                  onClick={onSubmitReview}
                  disabled={submittingReview || !review.trim()}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'support' && (
          <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-8">
            <div>
              <h2 className="mb-1 font-serif text-xl">Support</h2>
              <p className="text-sm text-muted">View your open tickets or start a new one.</p>
            </div>
            <Link
              href="/account/support"
              className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5"
            >
              Go to tickets
            </Link>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-7">
              <div>
                <div className="mb-1 font-semibold">Export your data</div>
                <p className="text-sm text-muted">Download everything we hold about your account as a JSON file.</p>
              </div>
              <button
                onClick={onExport}
                disabled={exporting}
                className="shrink-0 rounded-lg border border-line-soft px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
              >
                {exporting ? 'Preparing…' : 'Download'}
              </button>
            </div>

            <div className="rounded-2xl border border-red-400/25 bg-red-400/5 p-7">
              <div className="mb-1 font-semibold text-red-400">Delete account</div>
              <p className="mb-4 text-sm text-muted">Permanently deletes your account and login. This can&apos;t be undone.</p>
              {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
              {confirming ? (
                <div className="flex gap-3">
                  <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="rounded-lg bg-red-400 px-5 py-2.5 text-sm font-bold text-bg disabled:opacity-60"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                  </button>
                  <button onClick={() => setConfirming(false)} className="text-sm text-muted hover:text-fg">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400 hover:bg-red-400/10"
                >
                  Delete my account
                </button>
              )}
            </div>

            <button onClick={logout} className="text-sm text-muted hover:text-accent">
              Sign out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
