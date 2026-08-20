'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type FaqRow = { id: number; question: string; category: string; sort_order: number; is_active: boolean };

export default function AdminFaqsPage() {
  return (
    <ResourceManager<FaqRow>
      title="FAQs"
      description="Manages the frequently-asked-questions accordion. FAQs with category 'general' show on the site-wide FAQ section; FAQs whose category matches a specific service's slug show on that service's own page instead, alongside the general ones."
      example={`a visitor keeps asking "how long until we see results?" during sales calls. You add it here as a general FAQ, and it now answers the question upfront for every visitor before they even reach out.`}
      apiPath="/admin/faqs"
      columns={[
        { key: 'question', label: 'Question' },
        { key: 'category', label: 'Category' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'question', label: 'Question', type: 'text', help: 'The collapsed accordion header a visitor clicks to expand.' },
        { name: 'answer', label: 'Answer', type: 'textarea', help: 'The text revealed when the visitor expands this question.' },
        {
          name: 'category',
          label: 'Category ("general" or a service slug e.g. performance-marketing)',
          type: 'text',
          help: `"general" shows this FAQ everywhere the FAQ section appears. A service slug (matching that service's URL, e.g. "seo") shows it only on that specific service's page.`,
        },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Position within its category — lower numbers appear first in the accordion.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off hides this question from every FAQ section on the site without deleting it.' },
      ]}
      emptyItem={{ question: '', answer: '', category: 'general', sort_order: 0, is_active: true }}
    />
  );
}
