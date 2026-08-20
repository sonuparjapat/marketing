'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { setAdminSession } from '@/lib/adminAuth';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [code, setCode] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/login', { email, password });
      if (res.data.data.requires2fa) {
        setPendingToken(res.data.data.pendingToken);
        return;
      }
      const { token, admin } = res.data.data;
      setAdminSession(token, admin);
      router.replace('/admin');
    } catch (err: unknown) {
      setError(errMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/login/2fa', { pendingToken, code });
      const { token, admin } = res.data.data;
      setAdminSession(token, admin);
      router.replace('/admin');
    } catch (err: unknown) {
      setError(errMessage(err, 'Incorrect code'));
    } finally {
      setLoading(false);
    }
  };

  if (pendingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form onSubmit={onSubmitCode} className="w-full max-w-sm border border-line bg-bg2 p-10">
          <div className="font-serif-italic mb-2 text-2xl">
            Anvil <span className="text-accent">/ admin</span>
          </div>
          <p className="mb-8 text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
          <label className="mb-6 block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Authentication code</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-line bg-bg px-4 py-3 text-center text-lg tracking-[0.4em] focus:border-accent focus:outline-none"
              placeholder="000000"
              maxLength={6}
            />
          </label>
          {error && <p className="mb-5 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent px-6 py-3.5 text-sm font-bold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingToken('');
              setCode('');
              setError('');
            }}
            className="mt-4 w-full text-center text-xs text-muted hover:text-accent"
          >
            &larr; Back to sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm border border-line bg-bg2 p-10">
        <div className="font-serif-italic mb-8 text-2xl">
          Anvil <span className="text-accent">/ admin</span>
        </div>
        <label className="mb-5 block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line bg-bg px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="mb-6 block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Password</span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-bg px-4 py-3 pr-11 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-muted hover:text-accent"
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </label>
        {error && <p className="mb-5 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent px-6 py-3.5 text-sm font-bold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
