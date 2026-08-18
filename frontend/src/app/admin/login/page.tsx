'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { setAdminSession } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/login', { email, password });
      const { token, admin } = res.data.data;
      setAdminSession(token, admin);
      router.replace('/admin');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

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
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line bg-bg px-4 py-3 text-sm focus:border-accent focus:outline-none"
          />
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
