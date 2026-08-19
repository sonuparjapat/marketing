'use client';

import { useState, type FormEvent } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';

type Status = 'idle' | 'loading' | 'done' | 'error';

export function ContactForm({ services, budgets }: { services: string[]; budgets: string[] }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { show } = useToast();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());

    const nextErrors: Record<string, string> = {};
    if (!payload.name) nextErrors.name = 'Name is required';
    if (!payload.email) nextErrors.email = 'Email is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('loading');
    try {
      await apiClient.post('/leads', { ...payload, source: 'contact-page' });
      setStatus('done');
      show("Message sent — we'll get back to you within 24 hours.");
      formEl.reset();
    } catch {
      setStatus('error');
      show('Something went wrong — please try again.', 'error');
    }
  };

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-8">
        <p className="font-serif-italic text-accent text-xl">Thanks — message received.</p>
        <p className="mt-2 text-sm text-muted">We&apos;ll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" name="name" required error={errors.name} />
        <Field label="Email" name="email" type="email" required error={errors.email} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Phone" name="phone" />
        <Field label="Company" name="company" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField label="Service interested in" name="service_interested" options={services} />
        <SelectField label="Monthly budget" name="budget_range" options={budgets} />
      </div>
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Message</span>
        <textarea
          name="message"
          rows={4}
          className="w-full resize-none rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
          placeholder="Tell us about your brand and goals"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="group mt-2 inline-flex w-fit items-center gap-2.5 bg-accent px-8 py-4 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-14px_var(--accent)] disabled:pointer-events-none disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
      {status === 'error' && <p className="text-sm text-red-400">Something went wrong — please try again.</p>}
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        name={name}
        className={`w-full rounded-lg border bg-bg2 px-4 py-3 text-sm text-fg placeholder:text-faint focus:outline-none ${
          error ? 'border-red-400' : 'border-line-soft focus:border-accent'
        }`}
      />
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-wide text-muted">{label}</span>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm text-fg focus:border-accent focus:outline-none"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
