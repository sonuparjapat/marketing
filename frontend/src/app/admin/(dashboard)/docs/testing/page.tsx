import { StaticDocPage } from '@/components/admin/StaticDocPage';
import { TESTING_HTML } from '@/content/adminDocs/testing';

export default function TestingGuidePage() {
  return (
    <StaticDocPage
      title="Testing Guide"
      subtitle="What to check before every production deploy, across the public site, admin panel, and mobile app."
      contentHtml={TESTING_HTML}
    />
  );
}
