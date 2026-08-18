'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type PostRow = {
  id: number;
  title: string;
  category: string;
  is_published: boolean;
  views: number;
};

export default function AdminPostsPage() {
  return (
    <ResourceManager<PostRow>
      title="Blog Posts"
      apiPath="/admin/posts"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'views', label: 'Views' },
        { key: 'is_published', label: 'Published', render: (r) => (r.is_published ? 'Yes' : 'Draft') },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
        { name: 'content', label: 'Content', type: 'richtext' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'tags', label: 'Tags', type: 'string-array' },
        { name: 'author', label: 'Author', type: 'text' },
        { name: 'cover_image', label: 'Cover image', type: 'image' },
        { name: 'meta_title', label: 'Meta title', type: 'text' },
        { name: 'meta_description', label: 'Meta description', type: 'textarea' },
        { name: 'is_published', label: 'Published', type: 'boolean' },
      ]}
      emptyItem={{
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: [],
        author: 'Anvil Team',
        cover_image: '',
        meta_title: '',
        meta_description: '',
        is_published: false,
      }}
    />
  );
}
