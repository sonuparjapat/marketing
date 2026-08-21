'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { DocumentsPanel } from '@/components/admin/DocumentsPanel';

const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

type Task = {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: (typeof TASK_STATUSES)[number];
  assignee_id: number | null;
  assignee_name: string | null;
  due_date: string | null;
  sort_order: number;
};

type Project = {
  id: number;
  client_id: number;
  client_name: string;
  name: string;
  description: string | null;
  status: (typeof STATUSES)[number];
  start_date: string | null;
  end_date: string | null;
  budget_paise: number | null;
  tasks: Task[];
};

type AdminOption = { id: number; name: string };

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('projects.update');
  const canDelete = hasPermission('projects.delete');

  const [project, setProject] = useState<Project | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/projects/${params.id}`);
      setProject(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    apiClient.get('/admin/admins').then((res) => setAdmins(res.data.data.items)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    setProject((p) => (p ? { ...p, [key]: value } : p));
  };

  const onSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/admin/projects/${project.id}`, {
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        budget_paise: project.budget_paise,
      });
      setProject((p) => (p ? { ...p, ...res.data.data } : p));
      show('Project saved.');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This deletes its tasks and documents too, and can't be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/projects/${project.id}`);
      show('Project deleted.');
      router.push(`/admin/clients/${project.client_id}`);
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const addTask = async () => {
    if (!project || !newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await apiClient.post('/admin/tasks', { project_id: project.id, title: newTaskTitle.trim() });
      setProject((p) => (p ? { ...p, tasks: [...p.tasks, res.data.data] } : p));
      setNewTaskTitle('');
    } catch (err) {
      show(errMessage(err, 'Could not add the task.'), 'error');
    } finally {
      setAddingTask(false);
    }
  };

  const cycleStatus = async (task: Task) => {
    const next = TASK_STATUSES[(TASK_STATUSES.indexOf(task.status) + 1) % TASK_STATUSES.length];
    setProject((p) => (p ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, status: next } : t)) } : p));
    try {
      await apiClient.put(`/admin/tasks/${task.id}`, { status: next });
    } catch {
      show('Could not update the task — reloading.', 'error');
      load();
    }
  };

  const deleteTask = async (task: Task) => {
    setProject((p) => (p ? { ...p, tasks: p.tasks.filter((t) => t.id !== task.id) } : p));
    try {
      await apiClient.delete(`/admin/tasks/${task.id}`);
    } catch {
      show('Could not delete the task — reloading.', 'error');
      load();
    }
  };

  const onDrop = async (targetIndex: number) => {
    if (!project || dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...project.tasks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setProject((p) => (p ? { ...p, tasks: reordered } : p));

    const order = reordered.map((t, i) => ({ id: t.id, sort_order: i }));
    try {
      await apiClient.patch('/admin/tasks/reorder', { order });
    } catch {
      show('Failed to save the new order — reloading.', 'error');
      load();
    }
  };

  if (loading) return <p className="text-sm text-faint">Loading…</p>;
  if (!project) return <p className="text-sm text-faint">Project not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/clients/${project.client_id}`} className="mb-6 inline-block text-sm text-muted hover:text-accent">
        &larr; {project.client_name}
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl">{project.name}</h1>
        {canUpdate && (
          <Select value={project.status} onChange={(e) => update('status', e.target.value as Project['status'])} className="w-auto">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="space-y-5">
        <Input label="Name" value={project.name} onChange={(e) => update('name', e.target.value)} disabled={!canUpdate} />
        <Textarea label="Description" rows={3} value={project.description || ''} onChange={(e) => update('description', e.target.value)} disabled={!canUpdate} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Start date" type="date" value={project.start_date?.slice(0, 10) || ''} onChange={(e) => update('start_date', e.target.value)} disabled={!canUpdate} />
          <Input label="End date" type="date" value={project.end_date?.slice(0, 10) || ''} onChange={(e) => update('end_date', e.target.value)} disabled={!canUpdate} />
          <Input
            label="Budget (₹)"
            type="number"
            value={project.budget_paise ? project.budget_paise / 100 : ''}
            onChange={(e) => update('budget_paise', e.target.value ? Math.round(Number(e.target.value) * 100) : null)}
            disabled={!canUpdate}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        {canDelete ? (
          <button onClick={onDelete} disabled={deleting} className="text-sm text-red-400 hover:opacity-80 disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete project'}
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
        <h2 className="mb-1 text-xs uppercase tracking-[0.2em] text-accent">Tasks</h2>
        <p className="mb-4 text-[11px] text-faint">Click a task&apos;s status pill to cycle to-do → in progress → done. Drag to reorder.</p>
        <div className="space-y-2">
          {project.tasks.map((task, i) => (
            <div
              key={task.id}
              draggable={canUpdate}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className={`flex items-center gap-3 rounded-lg border border-line-soft bg-bg2 p-3 ${dragIndex === i ? 'opacity-40' : ''}`}
            >
              {canUpdate && (
                <span className="cursor-grab text-faint active:cursor-grabbing" title="Drag to reorder">
                  ⠿
                </span>
              )}
              <button
                onClick={() => cycleStatus(task)}
                disabled={!canUpdate}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  task.status === 'done' ? 'bg-accent text-bg' : task.status === 'in_progress' ? 'border border-accent/50 text-accent' : 'border border-line-soft text-faint'
                }`}
              >
                {task.status.replace('_', ' ')}
              </button>
              <span className={`flex-1 text-sm ${task.status === 'done' ? 'text-faint line-through' : ''}`}>{task.title}</span>
              <select
                value={task.assignee_id ?? ''}
                onChange={async (e) => {
                  const assignee_id = e.target.value ? Number(e.target.value) : null;
                  setProject((p) => (p ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, assignee_id } : t)) } : p));
                  await apiClient.put(`/admin/tasks/${task.id}`, { assignee_id });
                }}
                disabled={!canUpdate}
                className="border border-line bg-bg px-2 py-1 text-xs"
                aria-label={`Assignee for ${task.title}`}
              >
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {canUpdate && (
                <button onClick={() => deleteTask(task)} className="text-xs text-red-400 hover:opacity-80">
                  Remove
                </button>
              )}
            </div>
          ))}
          {!project.tasks.length && <p className="text-sm text-faint">No tasks yet.</p>}
        </div>
        {canUpdate && (
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              className="flex-1 border border-line bg-bg2 px-3.5 py-2.5 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <Button onClick={addTask} loading={addingTask} disabled={!newTaskTitle.trim()}>
              Add
            </Button>
          </div>
        )}
      </div>

      <DocumentsPanel
        entityType="project"
        entityId={project.id}
        canUpload={hasPermission('documents.create')}
        canDelete={hasPermission('documents.delete')}
      />
    </div>
  );
}
