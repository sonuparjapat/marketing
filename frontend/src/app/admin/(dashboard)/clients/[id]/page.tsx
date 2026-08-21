'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DocumentsPanel } from '@/components/admin/DocumentsPanel';

const STATUSES = ['active', 'paused', 'archived', 'churned'] as const;

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  status: (typeof STATUSES)[number];
  account_manager_id: number | null;
  notes: string | null;
  created_at: string;
};

type AdminOption = { id: number; name: string };
type ProjectSummary = { id: number; name: string; status: string; updated_at: string };
type InvoiceSummary = { id: number; invoice_number: string; amount_paise: number; status: string };

const INVOICE_STATUS_STYLE: Record<string, string> = {
  draft: 'text-faint',
  sent: 'text-amber-400',
  paid: 'text-accent',
  overdue: 'text-red-400',
  cancelled: 'text-faint',
  refunded: 'text-muted',
};

const PROJECT_STATUS_STYLE: Record<string, string> = {
  planning: 'text-faint',
  active: 'text-accent',
  on_hold: 'text-amber-400',
  completed: 'text-muted',
  cancelled: 'text-red-400',
};

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('clients.update');
  const canDelete = hasPermission('clients.delete');

  const [client, setClient] = useState<Client | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canCreateProjects = hasPermission('projects.create');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const loadProjects = async () => {
    const res = await apiClient.get('/admin/projects', { params: { client_id: params.id, limit: 50 } });
    setProjects(res.data.data.items);
  };

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const loadInvoices = async () => {
    const res = await apiClient.get('/admin/invoices', { params: { client_id: params.id, limit: 50 } });
    setInvoices(res.data.data.items);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/clients/${params.id}`);
      setClient(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadProjects().catch(() => {});
    loadInvoices().catch(() => {});
    apiClient.get('/admin/admins').then((res) => setAdmins(res.data.data.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const createProject = async () => {
    if (!client || !projectName.trim()) return;
    setSavingProject(true);
    try {
      const res = await apiClient.post('/admin/projects', { client_id: client.id, name: projectName.trim() });
      setCreatingProject(false);
      setProjectName('');
      router.push(`/admin/projects/${res.data.data.id}`);
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const update = <K extends keyof Client>(key: K, value: Client[K]) => {
    setClient((c) => (c ? { ...c, [key]: value } : c));
  };

  const onSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/clients/${client.id}`, {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        industry: client.industry,
        status: client.status,
        account_manager_id: client.account_manager_id,
        notes: client.notes,
      });
      setClient(res.data.data);
      show('Client saved.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!client) return;
    if (!confirm(`Delete "${client.name}"? This only works if they have no projects or invoices, and can't be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/clients/${client.id}`);
      show('Client deleted.');
      router.push('/admin/clients');
    } catch (err) {
      show(errMessage(err, 'This client has projects or invoices on record — archive it instead.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-faint">Loading…</p>;
  if (!client) return <p className="text-sm text-faint">Client not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/clients" className="mb-6 inline-block text-sm text-muted hover:text-accent">
        &larr; All clients
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl">{client.name}</h1>
        {canUpdate && (
          <Select
            value={client.status}
            onChange={(e) => update('status', e.target.value as Client['status'])}
            className="w-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="space-y-5">
        <Input label="Name" value={client.name} onChange={(e) => update('name', e.target.value)} disabled={!canUpdate} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" help="Where invoice payment links get sent." value={client.email || ''} onChange={(e) => update('email', e.target.value)} disabled={!canUpdate} />
          <Input label="Phone" value={client.phone || ''} onChange={(e) => update('phone', e.target.value)} disabled={!canUpdate} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company" value={client.company || ''} onChange={(e) => update('company', e.target.value)} disabled={!canUpdate} />
          <Input label="Industry" value={client.industry || ''} onChange={(e) => update('industry', e.target.value)} disabled={!canUpdate} />
        </div>
        <Select
          label="Account manager"
          help="Who on the team owns this relationship — purely informational, doesn't restrict access."
          value={client.account_manager_id ?? ''}
          onChange={(e) => update('account_manager_id', e.target.value ? Number(e.target.value) : null)}
          disabled={!canUpdate}
        >
          <option value="">Unassigned</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Textarea
          label="Notes"
          help="Private — internal context, never shown to the client."
          rows={4}
          value={client.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          disabled={!canUpdate}
        />
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        {canDelete ? (
          <button onClick={onDelete} disabled={deleting} className="text-sm text-red-400 hover:opacity-80 disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete client'}
          </button>
        ) : (
          <span />
        )}
        {canUpdate && (
          <Button onClick={onSave} loading={saving}>
            Save
          </Button>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Projects</h2>
          {canCreateProjects && (
            <button onClick={() => setCreatingProject(true)} className="text-xs text-accent hover:opacity-80">
              + New project
            </button>
          )}
        </div>
        {!projects.length ? (
          <p className="text-sm text-faint">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-line-soft p-3 text-sm hover:border-accent/40"
              >
                <span className="font-medium">{p.name}</span>
                <span className={`text-xs font-medium ${PROJECT_STATUS_STYLE[p.status] || 'text-faint'}`}>{p.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-accent">Invoices</h2>
          {hasPermission('invoices.create') && (
            <Link href="/admin/invoices" className="text-xs text-accent hover:opacity-80">
              + New invoice
            </Link>
          )}
        </div>
        {!invoices.length ? (
          <p className="text-sm text-faint">No invoices yet.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href="/admin/invoices"
                className="flex items-center justify-between rounded-lg border border-line-soft p-3 text-sm hover:border-accent/40"
              >
                <span className="font-medium">{inv.invoice_number}</span>
                <span className="text-muted">₹{(inv.amount_paise / 100).toLocaleString('en-IN')}</span>
                <span className={`text-xs font-medium ${INVOICE_STATUS_STYLE[inv.status] || 'text-faint'}`}>{inv.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={creatingProject}
        onClose={() => setCreatingProject(false)}
        title="New project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreatingProject(false)}>
              Cancel
            </Button>
            <Button onClick={createProject} loading={savingProject}>
              Create
            </Button>
          </>
        }
      >
        <Input label="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
      </Modal>

      <DocumentsPanel
        entityType="client"
        entityId={client.id}
        canUpload={hasPermission('documents.create')}
        canDelete={hasPermission('documents.delete')}
      />
    </div>
  );
}
