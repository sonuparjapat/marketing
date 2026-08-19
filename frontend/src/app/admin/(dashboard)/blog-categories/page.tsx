'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type CategoryRow = { id: number; name: string; slug: string; sort_order: number };

export default function BlogCategoriesPage() {
  return (
    <ResourceManager<CategoryRow>
      title="Blog Categories"
      apiPath="/admin/blog-categories"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'sort_order', label: 'Order' },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'sort_order', label: 'Sort order', type: 'number' },
      ]}
      emptyItem={{ name: '', sort_order: 0 }}
    />
  );
}
