'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { MailIcon, ArrowRightIcon } from '@/components/icons';

function VerifyEmailBody() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { verifyEmail } = useCustomerAuth();

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    verifyEmail(token).then((result) => {
      if (result.success) setStatus('success');
      else {
        setStatus('error');
        setMessage(result.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === 'checking') {
    return <p className="text-sm text-muted">Verifying your email…</p>;
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <p className="mb-8 text-sm leading-relaxed text-muted">{message || 'This verification link is invalid or has expired.'}</p>
        <Link href="/" className="text-accent hover:opacity-80">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-8 text-sm leading-relaxed text-muted">Your email is verified. You can now sign in to your account.</p>
      <Link
        href="/"
        className="group inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)]"
      >
        Return home <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24">
      <div className="glass glass-border-grad w-full max-w-md rounded-2xl p-9 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <MailIcon size={26} className="text-accent" />
        </div>
        <h1 className="mb-7 font-serif text-2xl">Email verification</h1>
        <Suspense fallback={null}>
          <VerifyEmailBody />
        </Suspense>
      </div>
    </main>
  );
}
