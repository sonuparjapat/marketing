'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, UserIcon, ArrowRightIcon, ShieldCheckIcon } from '@/components/icons';

type Mode = 'login' | 'register' | 'forgot' | 'sent' | 'sent-verify';

const HEADERS: Record<Mode, { title: string; subtitle: string }> = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your account' },
  register: { title: 'Create an account', subtitle: 'Free — takes less than a minute' },
  forgot: { title: 'Reset your password', subtitle: "We'll email you a secure link" },
  sent: { title: 'Check your inbox', subtitle: 'A reset link is on its way' },
  'sent-verify': { title: 'Check your inbox', subtitle: 'Verify your email to finish signing up' },
};

function Field({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightSlot,
}: {
  icon: typeof MailIcon;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <Icon size={16} className="pointer-events-none absolute left-3.5 text-faint" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-line-soft bg-bg px-3.5 py-3 pl-10 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-accent/50 ${rightSlot ? 'pr-10' : ''}`}
      />
      {rightSlot && <span className="absolute right-3.5">{rightSlot}</span>}
    </div>
  );
}

export function AuthDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, register, forgotPassword, resendVerification } = useCustomerAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
    setNeedsVerification(false);
    setResendState('idle');
  };

  const close = () => {
    reset();
    setMode('login');
    onClose();
  };

  const switchMode = (m: Mode) => {
    setError('');
    setNeedsVerification(false);
    setResendState('idle');
    setMode(m);
  };

  const onSubmit = async () => {
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);
    if (mode === 'forgot') {
      const result = await forgotPassword(email);
      setSubmitting(false);
      if (result.success) setMode('sent');
      else setError(result.message);
      return;
    }
    if (mode === 'register') {
      const result = await register(name, email, password);
      setSubmitting(false);
      if (result.success) setMode('sent-verify');
      else setError(result.message);
      return;
    }
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) return close();
    setError(result.message);
    if (result.message.toLowerCase().includes('verify')) setNeedsVerification(true);
  };

  const onResend = async () => {
    setResendState('sending');
    await resendVerification(email);
    setResendState('sent');
  };

  const header = HEADERS[mode];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line-soft bg-bg2 shadow-2xl"
          >
            <div className="relative overflow-hidden border-b border-line-soft px-7 pb-6 pt-8">
              <div className="animate-drift pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-[80px]" />
              <div className="animate-drift pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-accent-2/10 blur-[70px]" style={{ animationDelay: '-4s' }} />
              <div className="relative mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="font-serif-italic text-lg">Anvil</span>
                </div>
                <button onClick={close} aria-label="Close" className="text-muted transition-colors hover:text-fg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <h2 className="font-serif text-2xl">{header.title}</h2>
                <p className="mt-1 text-sm text-muted">{header.subtitle}</p>
              </div>
              {(mode === 'login' || mode === 'register') && (
                <div className="relative mt-6 grid grid-cols-2 gap-1 rounded-lg border border-line-soft bg-bg p-1">
                  <button
                    onClick={() => switchMode('login')}
                    className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${mode === 'login' ? 'bg-accent text-bg' : 'text-muted hover:text-fg'}`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => switchMode('register')}
                    className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${mode === 'register' ? 'bg-accent text-bg' : 'text-muted hover:text-fg'}`}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 px-7 py-7">
              {mode === 'sent' ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                    <MailIcon size={26} className="text-accent" />
                  </div>
                  <p className="mb-8 text-sm leading-relaxed text-muted">
                    If an account exists for <span className="text-fg">{email}</span>, we&apos;ve sent a link to reset your password. It expires in 1 hour.
                  </p>
                  <button
                    onClick={() => switchMode('login')}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:opacity-80"
                  >
                    Back to sign in <ArrowRightIcon size={14} />
                  </button>
                </div>
              ) : mode === 'sent-verify' ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                    <MailIcon size={26} className="text-accent" />
                  </div>
                  <p className="mb-2 text-sm leading-relaxed text-muted">
                    We&apos;ve sent a verification link to <span className="text-fg">{email}</span>.
                  </p>
                  <p className="mb-8 text-sm leading-relaxed text-muted">Verify your email, then sign in below.</p>
                  <button
                    onClick={() => switchMode('login')}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:opacity-80"
                  >
                    Back to sign in <ArrowRightIcon size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mode === 'register' && (
                    <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} />
                  )}
                  <Field icon={MailIcon} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                  {mode !== 'forgot' && (
                    <Field
                      icon={LockIcon}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
                      value={password}
                      onChange={setPassword}
                      rightSlot={
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-faint hover:text-muted">
                          {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                        </button>
                      }
                    />
                  )}

                  {mode === 'login' && (
                    <div className="text-right">
                      <button onClick={() => switchMode('forgot')} className="text-xs text-muted hover:text-accent">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-400">
                      {error}
                      {needsVerification && (
                        <>
                          {' '}
                          {resendState === 'sent' ? (
                            <span className="text-muted">Verification email sent.</span>
                          ) : (
                            <button
                              type="button"
                              onClick={onResend}
                              disabled={resendState === 'sending'}
                              className="text-accent underline hover:opacity-80 disabled:opacity-60"
                            >
                              {resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                            </button>
                          )}
                        </>
                      )}
                    </p>
                  )}

                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-accent py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_var(--accent)] disabled:opacity-60"
                  >
                    {submitting
                      ? 'Please wait…'
                      : mode === 'login'
                        ? 'Sign in'
                        : mode === 'register'
                          ? 'Create account'
                          : 'Send reset link'}
                    {!submitting && <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-1" />}
                  </button>

                  {mode === 'forgot' ? (
                    <button onClick={() => switchMode('login')} className="w-full text-center text-sm text-muted hover:text-accent">
                      Back to sign in
                    </button>
                  ) : (
                    <p className="text-center text-sm text-muted">
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-accent hover:opacity-80">
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>

            {mode !== 'sent' && mode !== 'sent-verify' && (
              <div className="flex flex-wrap gap-2 border-t border-line-soft px-7 py-5">
                {['Free to join', 'No spam, ever', 'Data stays private'].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line-soft bg-bg px-3 py-1.5 text-[11px] text-muted"
                  >
                    <ShieldCheckIcon size={12} className="text-accent" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
