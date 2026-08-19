import { StaticDocPage } from '@/components/admin/StaticDocPage';
import { DEVELOPER_HTML } from '@/content/adminDocs/developer';

export default function DeveloperDocsPage() {
  return (
    <StaticDocPage
      title="Developer Docs"
      subtitle="Architecture, database schema, API reference, and RBAC model — the technical reference for this codebase."
      contentHtml={DEVELOPER_HTML}
    />
  );
}
