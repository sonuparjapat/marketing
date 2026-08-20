'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type ServiceRow = {
  id: number;
  key: string;
  label: string;
  description: string;
  is_active: boolean;
};

export default function AdminPremiumServicesPage() {
  return (
    <ResourceManager<ServiceRow>
      title="Premium Services"
      apiPath="/admin/premium-services"
      hideDelete
      columns={[
        { key: 'label', label: 'Label' },
        { key: 'key', label: 'Key' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Retired') },
      ]}
      fields={[
        { name: 'label', label: 'Label', type: 'text', placeholder: 'e.g. Growth Playbooks' },
        { name: 'key', label: 'Key (stable identifier, no spaces)', type: 'text', placeholder: 'growth-playbooks' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ label: '', key: '', description: '', is_active: true }}
    />
  );
}
