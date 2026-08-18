'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type FaqRow = { id: number; question: string; category: string; sort_order: number; is_active: boolean };

export default function AdminFaqsPage() {
  return (
    <ResourceManager<FaqRow>
      title="FAQs"
      apiPath="/admin/faqs"
      columns={[
        { key: 'question', label: 'Question' },
        { key: 'category', label: 'Category' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'question', label: 'Question', type: 'text' },
        { name: 'answer', label: 'Answer', type: 'textarea' },
        {
          name: 'category',
          label: 'Category ("general" or a service slug e.g. performance-marketing)',
          type: 'text',
        },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{ question: '', answer: '', category: 'general', sort_order: 0, is_active: true }}
    />
  );
}
