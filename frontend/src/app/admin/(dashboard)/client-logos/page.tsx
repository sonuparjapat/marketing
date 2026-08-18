'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type LogoRow = { id: number; name: string; logo_url: string | null; sort_order: number; is_active: boolean };

export default function AdminClientLogosPage() {
  return (
    <ResourceManager<LogoRow>
      title="Client Logos"
      apiPath="/admin/client-logos"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'name', label: 'Client / brand name', type: 'text' },
        { name: 'logo_url', label: 'Logo (optional — falls back to text wordmark)', type: 'image' },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ name: '', logo_url: '', sort_order: 0, is_active: true }}
    />
  );
}
