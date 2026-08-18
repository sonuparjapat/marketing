'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type ServiceRow = {
  id: number;
  title: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminServicesPage() {
  return (
    <ResourceManager<ServiceRow>
      title="Services"
      apiPath="/admin/services"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'short_description', label: 'Short description', type: 'textarea' },
        { name: 'full_description', label: 'Full description', type: 'textarea' },
        {
          name: 'icon',
          label: 'Icon',
          type: 'select',
          options: ['target', 'search', 'sparkles', 'layout', 'workflow', 'users'],
        },
        { name: 'features_json', label: 'Features (comma-separated)', type: 'string-array' },
        { name: 'sort_order', label: 'Sort order (lower = first)', type: 'number' },
        { name: 'is_active', label: 'Active (visible on site)', type: 'boolean' },
      ]}
      emptyItem={{
        title: '',
        short_description: '',
        full_description: '',
        icon: 'target',
        features_json: [],
        sort_order: 0,
        is_active: true,
      }}
    />
  );
}
