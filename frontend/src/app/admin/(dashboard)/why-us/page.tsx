'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type PointRow = { id: number; point: string; sort_order: number; is_active: boolean };

export default function AdminWhyUsPage() {
  return (
    <ResourceManager<PointRow>
      title="Why Us"
      description="Manages the short bullet-point list in the homepage's 'Why work with us' section — the quick differentiators a visitor reads while deciding whether to keep scrolling or leave."
      example={`you notice prospects keep asking why you're different from other agencies. You add a point here like "We've built and sold our own D2C brand — we're not just running ads for one" — it appears as a new bullet on the homepage.`}
      apiPath="/admin/why-us"
      columns={[
        { key: 'point', label: 'Point' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'point', label: 'Point', type: 'textarea', help: 'One short differentiator, shown as a single bullet in the homepage "Why Us" list — keep it to a sentence or less.' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Position in the bullet list — lower numbers appear first.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off removes this bullet from the homepage without deleting it.' },
      ]}
      emptyItem={{ point: '', sort_order: 0, is_active: true }}
    />
  );
}
