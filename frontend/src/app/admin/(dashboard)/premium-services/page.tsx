'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type ServiceRow = {
  id: number;
  key: string;
  label: string;
  description: string;
  is_active: boolean;
};

export default function AdminPremiumServicesPage() {
  return (
    <ResourceManager<ServiceRow>
      title="Premium Services"
      description="The catalog of individually gate-able premium features — the building blocks that Subscription Plans are made of, and that a blog post can be locked behind. A service by itself does nothing until it's either bundled into a plan (so paying subscribers get it) or set as a post's required service (so it gates that post's content)."
      hideDelete
      example={`you want to start selling access to in-depth playbooks separately from everything else. You create a service here called "Growth Playbooks" — you can now add it to a Subscription Plan's bundle, and mark specific blog posts as requiring it in the post editor's Premium panel.`}
      apiPath="/admin/premium-services"
      columns={[
        { key: 'label', label: 'Label' },
        { key: 'key', label: 'Key' },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Retired') },
      ]}
      fields={[
        { name: 'label', label: 'Label', type: 'text', placeholder: 'e.g. Growth Playbooks', help: 'The human-readable name shown to admins picking services for a plan, and to customers as a feature bullet on the /premium pricing page.' },
        { name: 'key', label: 'Key (stable identifier, no spaces)', type: 'text', placeholder: 'growth-playbooks', help: "An internal, never-shown-to-customers identifier. Once a plan or post references this service, avoid changing the key — it's meant to stay stable." },
        { name: 'description', label: 'Description', type: 'textarea', help: 'A short explanation of what this service actually grants — shown to admins when deciding which services to bundle into a plan.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'Off retires this service from being addable to new plans or posts going forward. Existing plans/posts that already reference it keep working — this never breaks something already live.' },
      ]}
      emptyItem={{ label: '', key: '', description: '', is_active: true }}
    />
  );
}
