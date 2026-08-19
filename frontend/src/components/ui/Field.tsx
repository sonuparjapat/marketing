'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldClass = 'w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none';

function Label({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-xs uppercase tracking-wide text-muted">{label}</span>}
      {children}
    </label>
  );
}

export function Input({ label, className = '', ...rest }: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Label label={label}>
      <input className={`${fieldClass} ${className}`} {...rest} />
    </Label>
  );
}

export function Textarea({ label, className = '', ...rest }: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Label label={label}>
      <textarea className={`${fieldClass} resize-none ${className}`} {...rest} />
    </Label>
  );
}

export function Select({
  label,
  className = '',
  children,
  ...rest
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Label label={label}>
      <select className={`${fieldClass} ${className}`} {...rest}>
        {children}
      </select>
    </Label>
  );
}
