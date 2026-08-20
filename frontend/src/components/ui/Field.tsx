'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldClass = 'w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none';

// `help` is one concrete sentence on what this specific field controls and where it shows up —
// every input across the admin panel should carry one (see the standing project instruction this
// implements), not just fields that seem non-obvious.
function Label({ label, help, children }: { label?: string; help?: string; children: ReactNode }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
          {label}
          {help && <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">{help}</span>}
        </span>
      )}
      {children}
    </label>
  );
}

export function Input({
  label,
  help,
  className = '',
  ...rest
}: { label?: string; help?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Label label={label} help={help}>
      <input className={`${fieldClass} ${className}`} {...rest} />
    </Label>
  );
}

export function Textarea({
  label,
  help,
  className = '',
  ...rest
}: { label?: string; help?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Label label={label} help={help}>
      <textarea className={`${fieldClass} resize-none ${className}`} {...rest} />
    </Label>
  );
}

export function Select({
  label,
  help,
  className = '',
  children,
  ...rest
}: { label?: string; help?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Label label={label} help={help}>
      <select className={`${fieldClass} ${className}`} {...rest}>
        {children}
      </select>
    </Label>
  );
}
