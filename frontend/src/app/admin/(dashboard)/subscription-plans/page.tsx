'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SectionInfo } from '@/components/admin/SectionInfo';

type ServiceRef = { id: number; key: string; label: string };
type Plan = {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  price_paise: number;
  is_active: boolean;
  sort_order: number;
  services: ServiceRef[];
  active_subscribers: number;
};
type ServiceOption = { id: number; label: string; is_active: boolean };

const EMPTY_FORM = { name: '', description: '', duration_days: 30, price_rupees: '', is_active: true, sort_order: 0, service_ids: [] as number[] };

export default function AdminSubscriptionPlansPage() {
  const { hasPermission } = useAdminAuth();
  const { show } = useToast();
  const canCreate = hasPermission('subscription_plans.create');
  const canEdit = hasPermission('subscription_plans.update');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, servicesRes] = await Promise.all([
        apiClient.get('/admin/subscription-plans'),
        apiClient.get('/admin/premium-services', { params: { limit: 100 } }),
      ]);
      setPlans(plansRes.data.data);
      setServices(servicesRes.data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const locked = (editing?.active_subscribers ?? 0) > 0;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
    setError('');
  };

  const openEdit = (plan: Plan) => {
    setForm({
      name: plan.name,
      description: plan.description || '',
      duration_days: plan.duration_days,
      price_rupees: String(plan.price_paise / 100),
      is_active: plan.is_active,
      sort_order: plan.sort_order,
      service_ids: plan.services.map((s) => s.id),
    });
    setEditing(plan);
    setCreating(false);
    setError('');
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const toggleService = (id: number) => {
    setForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id) ? f.service_ids.filter((s) => s !== id) : [...f.service_ids, id],
    }));
  };

  const onSave = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.price_rupees || Number(form.price_rupees) <= 0) return setError('Enter a price.');
    if (!locked && form.service_ids.length === 0) return setError('Pick at least one service.');

    setSaving(true);
    setError('');
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description,
      duration_days: form.duration_days,
      price_paise: Math.round(Number(form.price_rupees) * 100),
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (!locked) payload.service_ids = form.service_ids;

    try {
      if (creating) {
        await apiClient.post('/admin/subscription-plans', payload);
      } else if (editing) {
        await apiClient.put(`/admin/subscription-plans/${editing.id}`, payload);
      }
      close();
      await load();
      show('Plan saved.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Something went wrong.');
      show(message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDuplicate = async (plan: Plan) => {
    try {
      const res = await apiClient.post(`/admin/subscription-plans/${plan.id}/duplicate`);
      await load();
      show('Duplicated — review and activate the copy when ready.');
      openEdit(res.data.data);
    } catch {
      show('Could not duplicate this plan.', 'error');
    }
  };

  const modalOpen = creating || editing !== null;
  const activeServices = services.filter((s) => s.is_active);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Subscription Plans</h1>
        {canCreate && <Button onClick={openCreate}>+ New plan</Button>}
      </div>
      <SectionInfo
        description="Manages the purchasable plans ('cards') shown on the public /premium pricing page — each one bundles a set of Premium Services and grants access to them for a fixed number of days once paid for via Razorpay. Price/description/active status stay editable any time, but a plan's service bundle locks the moment it has even one active subscriber — see Duplicate below for how to change an offering after that point."
        example={`you want to sell a "3-Month Growth Pass" bundling the Growth Playbooks and Priority Support services for ₹2,999. You create it here, add both services, turn it Active — it appears on /premium immediately. Once someone buys it, its service list is locked; to add a third service you'd Duplicate it into a new plan instead of editing this one.`}
      />

      {loading && !plans.length ? (
        <div className="border border-line">
          <TableSkeleton rows={4} cols={6} />
        </div>
      ) : !plans.length ? (
        <EmptyState title="No plans yet" description={canCreate ? 'Create your first plan to start selling premium access.' : undefined} />
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-bg2 text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Active subscribers</th>
                <th className="px-4 py-3">Status</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-line last:border-0 hover:bg-bg2/50">
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">{plan.duration_days} days</td>
                  <td className="px-4 py-3">₹{(plan.price_paise / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-faint">{plan.services.map((s) => s.label).join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    {plan.active_subscribers > 0 ? (
                      <span className="text-accent">{plan.active_subscribers} locked</span>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 py-3">{plan.is_active ? 'Active' : 'Hidden'}</td>
                  {canEdit && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => openEdit(plan)} className="mr-4 text-accent hover:opacity-80">
                        Edit
                      </button>
                      <button onClick={() => onDuplicate(plan)} className="text-muted hover:text-fg">
                        Duplicate
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={close}
        title={creating ? 'New plan' : `Edit ${editing?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
              Name
              <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                Shown as the plan card&apos;s title on /premium and in every payment/subscription record tied to it.
              </span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 1-Month Growth Pass"
              className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
              Description
              <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                A short pitch shown under the plan name on the pricing card.
              </span>
            </span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full resize-none border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Duration (days)
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  How many days of access a purchase grants, counted from the moment payment is verified.
                </span>
              </span>
              <input
                type="number"
                value={form.duration_days}
                onChange={(e) => setForm((f) => ({ ...f, duration_days: Number(e.target.value) }))}
                className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Price (₹)
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  Charged once via Razorpay at checkout. Changing this only affects future purchases — existing subscribers keep what they paid.
                </span>
              </span>
              <input
                type="number"
                value={form.price_rupees}
                onChange={(e) => setForm((f) => ({ ...f, price_rupees: e.target.value }))}
                placeholder="999"
                className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span>
              <span className="block text-sm">Active (visible on the pricing page)</span>
              <span className="mt-0.5 block text-[11px] text-faint">Off hides this plan from /premium without deleting it — existing subscribers keep their access either way.</span>
            </span>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted">Services included</span>
              {locked && <span className="text-[11px] text-accent">Locked — {editing?.active_subscribers} active subscriber(s)</span>}
            </div>
            {locked ? (
              <p className="rounded-md border border-line-soft bg-bg2/60 p-3 text-[13px] leading-relaxed text-muted">
                This plan has active subscribers, so its services can&apos;t change — adding one would hand out free value nobody
                paid for, and removing one would take away something a paying customer already bought. Use{' '}
                <span className="text-fg">Duplicate</span> from the list to offer a different bundle instead.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 rounded-md border border-line-soft p-3">
                {activeServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.service_ids.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="h-4 w-4 accent-accent"
                    />
                    {s.label}
                  </label>
                ))}
                {!activeServices.length && <p className="text-sm text-faint">No active services yet — create one first.</p>}
              </div>
            )}
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </Modal>
    </div>
  );
}
