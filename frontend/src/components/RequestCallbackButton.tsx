'use client';

import { useState, type FormEvent } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

export function RequestCallbackButton() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast();

  const close = () => {
    setOpen(false);
    setTimeout(() => setDone(false), 300);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());
    if (!payload.name || !payload.phone) {
      setError('Name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/callbacks', payload);
      setDone(true);
      show("Got it — we'll call you back soon.");
      formEl.reset();
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-accent underline underline-offset-4 hover:opacity-80"
      >
        Or request a callback instead &rarr;
      </button>

      <Modal open={open} onClose={close} title={done ? 'Request received' : 'Request a callback'}>
        {done ? (
          <div>
            <p className="text-sm text-muted">We&apos;ll call you back at the number you shared, usually within 24 hours.</p>
            <Button className="mt-6" onClick={close}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <Input label="Name *" name="name" required />
            <Input label="Phone *" name="phone" type="tel" required />
            <Input label="Preferred time" name="preferred_time" placeholder="e.g. Weekdays after 4pm" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" loading={saving} className="w-full">
              Request callback
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
