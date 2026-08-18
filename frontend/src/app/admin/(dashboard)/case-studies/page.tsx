'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type CaseStudyRow = {
  id: number;
  title: string;
  client_industry: string;
  is_featured: boolean;
  is_published: boolean;
};

export default function AdminCaseStudiesPage() {
  return (
    <ResourceManager<CaseStudyRow>
      title="Case Studies"
      apiPath="/admin/case-studies"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'client_industry', label: 'Industry' },
        { key: 'is_featured', label: 'Featured', render: (r) => (r.is_featured ? 'Yes' : '') },
        { key: 'is_published', label: 'Published', render: (r) => (r.is_published ? 'Yes' : 'Draft') },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'client_name', label: 'Client name', type: 'text' },
        { name: 'client_industry', label: 'Industry', type: 'text' },
        { name: 'challenge', label: 'Challenge', type: 'richtext' },
        { name: 'solution', label: 'Solution', type: 'richtext' },
        {
          name: 'results_json',
          label: 'Results (JSON array of {metric, value, label})',
          type: 'json',
        },
        { name: 'cover_image', label: 'Cover image', type: 'image' },
        { name: 'tags', label: 'Tags', type: 'string-array' },
        { name: 'is_featured', label: 'Featured on homepage', type: 'boolean' },
        { name: 'is_published', label: 'Published', type: 'boolean' },
      ]}
      emptyItem={{
        title: '',
        client_name: '',
        client_industry: '',
        challenge: '',
        solution: '',
        results_json: [],
        cover_image: '',
        tags: [],
        is_featured: false,
        is_published: false,
      }}
    />
  );
}
