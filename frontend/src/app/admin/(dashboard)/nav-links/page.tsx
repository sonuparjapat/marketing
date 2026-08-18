'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type NavLinkRow = { id: number; label: string; href: string; location: string; sort_order: number; is_active: boolean };

export default function AdminNavLinksPage() {
  return (
    <ResourceManager<NavLinkRow>
      title="Nav Links"
      apiPath="/admin/nav-links"
      columns={[
        { key: 'label', label: 'Label' },
        { key: 'href', label: 'Link' },
        { key: 'location', label: 'Location' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'label', label: 'Label', type: 'text' },
        { name: 'href', label: 'Link (e.g. /services)', type: 'text' },
        { name: 'location', label: 'Location', type: 'select', options: ['header', 'footer'] },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ label: '', href: '', location: 'header', sort_order: 0, is_active: true }}
    />
  );
}
