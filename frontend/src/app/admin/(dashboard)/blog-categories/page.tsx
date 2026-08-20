'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type CategoryRow = { id: number; name: string; slug: string; sort_order: number };

export default function BlogCategoriesPage() {
  return (
    <ResourceManager<CategoryRow>
      title="Blog Categories"
      description="Manages the category list that the blog post editor's category dropdown pulls from, and the filter chips shown on the public /blog page. A category here does NOT delete or hide posts already assigned to it — renaming a category doesn't rename it on existing posts, since posts store the category as plain text, not a live link."
      example={`you add a category named "SEO" here. It now appears as a choice in the post editor's Category dropdown, and once at least one published post uses it, a matching "SEO" filter chip appears on /blog for visitors to click.`}
      apiPath="/admin/blog-categories"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'sort_order', label: 'Order' },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', help: 'The category as it appears everywhere — the post editor dropdown, the /blog filter chips, and the URL slug (auto-derived from this).' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Lower numbers appear first in the filter chip row on /blog. Two categories with the same number fall back to alphabetical order.' },
      ]}
      emptyItem={{ name: '', sort_order: 0 }}
    />
  );
}
