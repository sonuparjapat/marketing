import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-line px-8 py-16 text-center">
      <p className="text-sm font-medium text-muted">{title}</p>
      {description && <p className="max-w-sm text-xs text-faint">{description}</p>}
      {action}
    </div>
  );
}
