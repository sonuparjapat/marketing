'use client';

import { useState } from 'react';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, register } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = mode === 'login' ? await login(email, password) : await register(name, email, password);
    setSubmitting(false);
    if (result.success) {
      close();
    } else {
      setError(result.message);
    }
  };

  return (
    <Modal open={open} onClose={close} title={mode === 'login' ? 'Sign in' : 'Create an account'}>
      <div className="space-y-5">
        {mode === 'register' && <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={onSubmit} loading={submitting} className="w-full">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
        <p className="text-center text-sm text-muted">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              reset();
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="text-accent hover:opacity-80"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </Modal>
  );
}
