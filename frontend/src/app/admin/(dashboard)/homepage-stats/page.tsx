'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type StatRow = { id: number; value: string; label: string; sort_order: number; is_active: boolean };

export default function AdminHomepageStatsPage() {
  return (
    <ResourceManager<StatRow>
      title="Homepage Stats"
      description="Manages the row of big numbers on the homepage (the 'proof strip' near the top) — quick-glance credibility numbers a visitor sees in the first few seconds, before reading anything else."
      example={`your 50th client just signed. You edit the existing "50+ / Brands scaled" row's Value to "50+", or add a new stat like "₹40Cr / Ad spend managed" — it appears in the homepage stat row on next page load, no code change needed.`}
      apiPath="/admin/homepage-stats"
      columns={[
        { key: 'value', label: 'Value' },
        { key: 'label', label: 'Label' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'value', label: 'Value (e.g. 50+)', type: 'text', help: 'The large number/figure itself — kept short, it renders in a big bold font.' },
        { name: 'label', label: 'Label (e.g. Brands scaled)', type: 'text', help: 'The small caption under the value, explaining what it counts.' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Left-to-right position in the stat row — lower numbers appear first.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off removes this stat from the homepage row without deleting it.' },
      ]}
      emptyItem={{ value: '', label: '', sort_order: 0, is_active: true }}
    />
  );
}
