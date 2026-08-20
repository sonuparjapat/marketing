'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type TeamRow = {
  id: number;
  name: string;
  designation: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminTeamPage() {
  return (
    <ResourceManager<TeamRow>
      title="Team"
      description="Manages team member profiles shown on the /about page's team grid, and doubles as the author list a blog post can be attributed to in the post editor — pick a team member as a post's author and their photo/bio/LinkedIn appear on that post automatically."
      example="a new strategist, Priya, joins. You add her here with a photo and designation — she now appears on /about, and shows up as a selectable author the next time someone writes a blog post, complete with an author bio card at the bottom of anything she's credited on."
      apiPath="/admin/team"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'sort_order', label: 'Order' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', help: 'Shown on the /about team grid and as the byline on any blog post they author.' },
        { name: 'designation', label: 'Designation', type: 'text', help: 'Job title, e.g. "Head of Performance Marketing" — shown under their name everywhere they appear.' },
        { name: 'bio', label: 'Bio', type: 'textarea', help: 'A short paragraph shown on their /about card and on the author bio block at the end of posts they write.' },
        { name: 'photo', label: 'Photo', type: 'image', help: "Their headshot. Missing photos fall back to a plain initial-letter avatar, so it's fine to leave blank temporarily." },
        { name: 'linkedin_url', label: 'LinkedIn URL', type: 'text', help: 'Optional — adds a clickable LinkedIn icon/link to their profile card and author bio.' },
        { name: 'sort_order', label: 'Sort order', type: 'number', help: 'Position in the /about team grid — lower numbers appear first.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off removes them from the public /about grid and the post-editor author picker, without deleting their record or unlinking posts they already wrote.' },
      ]}
      emptyItem={{
        name: '',
        designation: '',
        bio: '',
        photo: '',
        linkedin_url: '',
        sort_order: 0,
        is_active: true,
      }}
    />
  );
}
