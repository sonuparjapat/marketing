'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type LogoRow = { id: number; name: string; logo_url: string | null; sort_order: number; is_active: boolean };

export default function AdminClientLogosPage() {
  return (
    <ResourceManager<LogoRow>
      title="Client Logos"
      description="Manages the scrolling logo strip ('trusted by') shown on the homepage, just below the hero section — social proof for visitors who don't recognize the agency yet but do recognize the brands it's worked with."
      example="you land a new client, Acme Skincare. You add a row here with their name and logo image, turn Active on, and their logo joins the scrolling marquee on the homepage the next time it loads."
      apiPath="/admin/client-logos"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'name', label: 'Client / brand name', type: 'text', help: 'Used as the accessible alt text for the logo image, and as the fallback text wordmark if no logo image is uploaded.' },
        { name: 'logo_url', label: 'Logo (optional — falls back to text wordmark)', type: 'image', help: 'A transparent-background PNG/SVG works best in the scrolling strip. Leave empty to show the client name as plain text instead.' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Position in the scrolling logo strip, left to right — lower numbers appear first.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off removes this logo from the homepage strip immediately without deleting it — useful when a client relationship ends but you want to keep the record.' },
      ]}
      emptyItem={{ name: '', logo_url: '', sort_order: 0, is_active: true }}
    />
  );
}
