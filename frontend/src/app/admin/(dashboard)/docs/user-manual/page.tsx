import { StaticDocPage } from '@/components/admin/StaticDocPage';
import { USER_MANUAL_HTML } from '@/content/adminDocs/userManual';

export default function UserManualPage() {
  return (
    <StaticDocPage
      title="User Manual"
      subtitle="The complete guide to running the site day-to-day from the admin panel — no coding required."
      contentHtml={USER_MANUAL_HTML}
    />
  );
}
