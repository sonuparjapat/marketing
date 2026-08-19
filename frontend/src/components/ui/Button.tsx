'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
};

const VARIANTS: Record<string, string> = {
  primary: 'bg-accent text-bg font-bold hover:opacity-90 disabled:opacity-60',
  secondary: 'border border-line text-fg hover:border-accent hover:text-accent disabled:opacity-60',
  ghost: 'text-muted hover:text-fg disabled:opacity-60',
  danger: 'text-red-400 hover:opacity-80 disabled:opacity-60',
};

export function Button({ variant = 'primary', loading, disabled, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm transition-opacity ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
