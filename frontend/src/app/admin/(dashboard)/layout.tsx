import { AdminShell } from '@/components/admin/AdminShell';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
