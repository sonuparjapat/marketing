'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminSocket } from '@/lib/useAdminSocket';
import { useToast } from '@/components/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';
import { TwoFactorModal } from '@/components/admin/TwoFactorModal';

type NavItem = { href: string; label: string; permission?: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: '', items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    label: 'Inbox',
    items: [
      { href: '/admin/leads', label: 'Leads', permission: 'leads.read' },
      { href: '/admin/callbacks', label: 'Callbacks', permission: 'callbacks.read' },
      { href: '/admin/subscribers', label: 'Subscribers', permission: 'subscribers.read' },
      { href: '/admin/support-tickets', label: 'Support Tickets', permission: 'support_tickets.read' },
      { href: '/admin/customers', label: 'Customers', permission: 'customers.read' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/posts', label: 'Blog', permission: 'posts.read' },
      { href: '/admin/blog-categories', label: 'Blog Categories', permission: 'blog_categories.read' },
      { href: '/admin/case-studies', label: 'Case Studies', permission: 'case_studies.read' },
      { href: '/admin/services', label: 'Services', permission: 'services.read' },
      { href: '/admin/testimonials', label: 'Testimonials', permission: 'testimonials.read' },
      { href: '/admin/comments', label: 'Comments', permission: 'comments.read' },
      { href: '/admin/team', label: 'Team', permission: 'team.read' },
      { href: '/admin/faqs', label: 'FAQs', permission: 'faqs.read' },
      { href: '/admin/pages', label: 'Pages', permission: 'pages.read' },
    ],
  },
  {
    label: 'Homepage',
    items: [
      { href: '/admin/homepage-sections', label: 'Sections', permission: 'homepage_sections.read' },
      { href: '/admin/banners', label: 'Banners', permission: 'banners.read' },
      { href: '/admin/homepage-reviews', label: 'Homepage Reviews', permission: 'testimonials.read' },
      { href: '/admin/homepage-stats', label: 'Stats', permission: 'homepage_stats.read' },
      { href: '/admin/why-us', label: 'Why Us', permission: 'why_us.read' },
      { href: '/admin/client-logos', label: 'Client Logos', permission: 'client_logos.read' },
      { href: '/admin/nav-links', label: 'Nav Links', permission: 'nav_links.read' },
    ],
  },
  {
    label: 'Subscriptions',
    items: [
      { href: '/admin/subscription-plans', label: 'Plans', permission: 'subscription_plans.read' },
      { href: '/admin/premium-services', label: 'Premium Services', permission: 'premium_services.read' },
      { href: '/admin/payments', label: 'Payments', permission: 'payments.read' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', permission: 'analytics.read' },
      { href: '/admin/logs', label: 'Activity Log', permission: 'logs.read' },
    ],
  },
  {
    label: 'Docs',
    items: [
      { href: '/admin/docs/user-manual', label: 'User Manual' },
      { href: '/admin/docs/testing', label: 'Testing Guide' },
      { href: '/admin/docs/developer', label: 'Developer Docs' },
    ],
  },
  {
    label: '',
    items: [
      { href: '/admin/media', label: 'Media Library', permission: 'media.read' },
      { href: '/admin/settings', label: 'Settings', permission: 'settings.read' },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, loading, isSuperAdmin, hasPermission, logout } = useAdminAuth();
  const [inboxBadge, setInboxBadge] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);
  const [managing2fa, setManaging2fa] = useState(false);
  const { show } = useToast();

  useAdminSocket({
    onNewLead: (data) => {
      const lead = data as { name?: string };
      show(`New lead: ${lead.name || 'Someone'} just got in touch.`);
      setInboxBadge((n) => n + 1);
    },
    onNewCallback: (data) => {
      const cb = data as { name?: string };
      show(`New callback request from ${cb.name || 'someone'}.`);
      setInboxBadge((n) => n + 1);
    },
    onNewTicket: (data) => {
      const ticket = data as { subject?: string };
      show(`New support ticket: ${ticket.subject || 'Untitled'}.`);
      setInboxBadge((n) => n + 1);
    },
    onNewTicketMessage: () => {
      show('A customer replied to a support ticket.');
      setInboxBadge((n) => n + 1);
    },
  });

  useEffect(() => {
    if (pathname === '/admin/leads' || pathname === '/admin/callbacks') setInboxBadge(0);
  }, [pathname]);

  if (loading || !admin) {
    return <PageLoader label="Checking session…" />;
  }

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  if (isSuperAdmin) {
    navGroups[navGroups.length - 1].items.push(
      { href: '/admin/departments', label: 'Departments' },
      { href: '/admin/admins', label: 'Admins' }
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-line bg-bg2 px-5 py-8">
        <Link href="/admin" className="font-serif-italic mb-10 block px-2 text-xl">
          Anvil <span className="text-accent">/ admin</span>
        </Link>
        <nav className="flex flex-col gap-5">
          {navGroups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              {group.label && (
                <div className="flex items-center gap-2 px-3 pb-1 text-[11px] uppercase tracking-wider text-faint">
                  {group.label}
                  {group.label === 'Inbox' && inboxBadge > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
                      {inboxBadge}
                    </span>
                  )}
                </div>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-sm px-3 py-2.5 text-sm transition-colors ${
                      active ? 'bg-accent text-bg font-semibold' : 'text-muted hover:bg-bg hover:text-fg'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-line px-8 py-4">
          <span className="text-sm text-muted">
            Signed in as {admin?.name || admin?.email}
            {admin?.department_name && <span className="text-faint"> · {admin.department_name}</span>}
          </span>
          <div className="flex items-center gap-5">
            <button onClick={() => setManaging2fa(true)} className="text-sm text-muted hover:text-accent">
              {admin?.totp_enabled ? '2FA on' : 'Set up 2FA'}
            </button>
            <button onClick={() => setChangingPassword(true)} className="text-sm text-muted hover:text-accent">
              Change password
            </button>
            <button onClick={logout} className="text-sm text-muted hover:text-accent">
              Log out
            </button>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
      <TwoFactorModal open={managing2fa} onClose={() => setManaging2fa(false)} />
    </div>
  );
}
