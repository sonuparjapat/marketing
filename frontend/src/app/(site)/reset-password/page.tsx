'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from '@/components/icons';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useCustomerAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    const result = await resetPassword(token, password);
    setSubmitting(false);
    if (result.success) setDone(true);
    else setError(result.message);
  };

  if (!token) {
    return (
      <p className="text-sm text-muted">
        This reset link is missing its token. Request a new one from the sign-in menu, or{' '}
        <Link href="/" className="text-accent hover:opacity-80">
          return home
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="mb-7 text-sm leading-relaxed text-muted">Your password has been updated. You can now sign in with your new password.</p>
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)]"
        >
          Return home <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative flex items-center">
        <LockIcon size={16} className="pointer-events-none absolute left-3.5 text-faint" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line-soft bg-bg2 px-3.5 py-3 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-faint focus:border-accent/50"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3.5 text-faint hover:text-muted"
        >
          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>
      </div>
      <div className="relative flex items-center">
        <LockIcon size={16} className="pointer-events-none absolute left-3.5 text-faint" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-line-soft bg-bg2 px-3.5 py-3 pl-10 text-sm outline-none transition-colors placeholder:text-faint focus:border-accent/50"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="group flex w-full items-center justify-center gap-2 bg-accent py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)] disabled:opacity-60"
      >
        {submitting ? 'Updating…' : 'Update password'}
        {!submitting && <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="glass glass-border-grad w-full max-w-md rounded-2xl p-9">
        <h1 className="mb-1.5 font-serif text-2xl">Reset your password</h1>
        <p className="mb-7 text-sm text-muted">Choose a new password for your account.</p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
