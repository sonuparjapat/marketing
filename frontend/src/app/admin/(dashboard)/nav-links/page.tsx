'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type NavLinkRow = { id: number; label: string; href: string; location: string; sort_order: number; is_active: boolean };

export default function AdminNavLinksPage() {
  return (
    <ResourceManager<NavLinkRow>
      title="Nav Links"
      description="Manages the header navigation menu and the footer link list on the public site. If this list is empty, the site falls back to a hardcoded default menu built into the code — add links here to take control of it."
      example={`you launch the new /premium pricing page and want it discoverable. You add a row with Label "Premium", Link "/premium", Location "header" — it appears in the header nav on every public page, in the position set by Sort order.`}
      apiPath="/admin/nav-links"
      columns={[
        { key: 'label', label: 'Label' },
        { key: 'href', label: 'Link' },
        { key: 'location', label: 'Location' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'label', label: 'Label', type: 'text', help: 'The clickable text shown in the menu, e.g. "Services".' },
        { name: 'href', label: 'Link (e.g. /services)', type: 'text', help: 'Where clicking it goes — an internal path starting with / (e.g. /contact), or a full https:// URL for an external link.' },
        { name: 'location', label: 'Location', type: 'select', options: ['header', 'footer'], help: 'Which menu this link appears in — the top header nav, or the footer link list.' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Left-to-right (header) or top-to-bottom (footer) position — lower numbers appear first.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off removes this link from the menu without deleting it — handy for temporarily hiding a page.' },
      ]}
      emptyItem={{ label: '', href: '', location: 'header', sort_order: 0, is_active: true }}
    />
  );
}
