'use client';

import { useState } from 'react';
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

export default function AccountPage() {
  const { customer, loading, logout } = useCustomerAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[640px]">
        <span className="text-xs uppercase tracking-[0.2em] text-accent">Your account</span>
        <h1 className="mt-3 mb-10 font-serif text-3xl font-normal">Hi, {customer.name.split(' ')[0]}.</h1>

        <div className="glass mb-8 rounded-2xl p-7">
          <div className="mb-1 text-xs uppercase tracking-wide text-faint">Name</div>
          <div className="mb-5">{customer.name}</div>
          <div className="mb-1 text-xs uppercase tracking-wide text-faint">Email</div>
          <div>{customer.email}</div>
        </div>

        <div className="glass mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-7">
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
          <p className="mb-4 text-sm text-muted">
            Permanently deletes your account and login. This can&apos;t be undone.
          </p>
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

        <button onClick={logout} className="mt-8 text-sm text-muted hover:text-accent">
          Sign out
        </button>
      </div>
    </main>
  );
}
