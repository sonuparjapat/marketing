'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type TeamRow = {
  id: number;
  name: string;
  designation: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminTeamPage() {
  return (
    <ResourceManager<TeamRow>
      title="Team"
      apiPath="/admin/team"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'designation', label: 'Designation', type: 'text' },
        { name: 'bio', label: 'Bio', type: 'textarea' },
        { name: 'photo', label: 'Photo', type: 'image' },
        { name: 'linkedin_url', label: 'LinkedIn URL', type: 'text' },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{
        name: '',
        designation: '',
        bio: '',
        photo: '',
        linkedin_url: '',
        sort_order: 0,
        is_active: true,
      }}
    />
  );
}
