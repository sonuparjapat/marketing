'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type PointRow = { id: number; point: string; sort_order: number; is_active: boolean };

export default function AdminWhyUsPage() {
  return (
    <ResourceManager<PointRow>
      title="Why Us"
      apiPath="/admin/why-us"
      columns={[
        { key: 'point', label: 'Point' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'point', label: 'Point', type: 'textarea' },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ point: '', sort_order: 0, is_active: true }}
    />
  );
}
