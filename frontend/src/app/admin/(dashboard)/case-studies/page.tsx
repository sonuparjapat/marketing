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
      description="Manages the case study / portfolio entries shown on the public /work listing and their individual /work/[slug] detail pages — the proof-of-results content prospects read before getting in touch. A case study only appears publicly once Published is on."
      example="you close a project for a skincare brand that 3x'd its revenue. You create a case study here with the before/after numbers in Results, mark it Published, and it appears on /work immediately — mark it Featured too and it becomes the large hero case study on the homepage."
      apiPath="/admin/case-studies"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'client_industry', label: 'Industry' },
        { key: 'is_featured', label: 'Featured', render: (r) => (r.is_featured ? 'Yes' : '') },
        { key: 'is_published', label: 'Published', render: (r) => (r.is_published ? 'Yes' : 'Draft') },
      ]}
      fields={[
        { name: 'title', label: 'Title', type: 'text', help: 'The case study headline — shown on the /work card and as the <h1> on its detail page.' },
        { name: 'client_name', label: 'Client name', type: 'text', help: "The client/brand this work was done for. Shown on the case study's detail page as attribution." },
        { name: 'client_industry', label: 'Industry', type: 'text', help: 'e.g. "D2C Skincare" — shown as a small tag on the case study card, and lets visitors scan /work by industry at a glance.' },
        { name: 'challenge', label: 'Challenge', type: 'richtext', help: "The problem the client came to you with — the 'before' half of the story on the detail page." },
        { name: 'solution', label: 'Solution', type: 'richtext', help: "What you actually did about it — the 'after' half of the story, shown right below Challenge." },
        {
          name: 'results_json',
          label: 'Results (JSON array of {metric, value, label})',
          type: 'json',
          help: 'The headline numbers shown as stat cards on the case study, e.g. [{"metric":"Revenue","value":"+212%","label":"in 6 months"}]. Each object becomes one stat card.',
        },
        { name: 'cover_image', label: 'Cover image', type: 'image', help: 'The thumbnail shown on the /work grid and the banner image at the top of the detail page.' },
        { name: 'tags', label: 'Tags', type: 'string-array', help: 'Free-text labels shown as small chips on the card, e.g. "Meta Ads, SEO" — purely descriptive, not filterable.' },
        { name: 'is_featured', label: 'Featured on homepage', type: 'boolean', help: 'Turns this into the large hero case study block on the homepage. Only one should be featured at a time — the newest featured one wins if more than one is marked.' },
        { name: 'is_published', label: 'Published', type: 'boolean', help: 'Off means this case study is saved as a draft — invisible on /work and its detail page 404s for visitors, but still editable here.' },
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
