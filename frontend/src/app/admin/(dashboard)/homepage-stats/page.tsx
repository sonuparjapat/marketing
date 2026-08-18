'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type StatRow = { id: number; value: string; label: string; sort_order: number; is_active: boolean };

export default function AdminHomepageStatsPage() {
  return (
    <ResourceManager<StatRow>
      title="Homepage Stats"
      apiPath="/admin/homepage-stats"
      columns={[
        { key: 'value', label: 'Value' },
        { key: 'label', label: 'Label' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'value', label: 'Value (e.g. 50+)', type: 'text' },
        { name: 'label', label: 'Label (e.g. Brands scaled)', type: 'text' },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ value: '', label: '', sort_order: 0, is_active: true }}
    />
  );
}
