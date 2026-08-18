'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { getAdminUser, clearAdminSession, getAdminToken, type AdminUser } from '@/lib/adminAuth';

const NAV_GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  { label: '', items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    label: 'Inbox',
    items: [
      { href: '/admin/leads', label: 'Leads' },
      { href: '/admin/callbacks', label: 'Callbacks' },
      { href: '/admin/subscribers', label: 'Subscribers' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/posts', label: 'Blog' },
      { href: '/admin/case-studies', label: 'Case Studies' },
      { href: '/admin/services', label: 'Services' },
      { href: '/admin/testimonials', label: 'Testimonials' },
      { href: '/admin/team', label: 'Team' },
      { href: '/admin/faqs', label: 'FAQs' },
      { href: '/admin/pages', label: 'Pages' },
    ],
  },
  {
    label: 'Homepage',
    items: [
      { href: '/admin/homepage-sections', label: 'Sections' },
      { href: '/admin/homepage-stats', label: 'Stats' },
      { href: '/admin/why-us', label: 'Why Us' },
      { href: '/admin/client-logos', label: 'Client Logos' },
      { href: '/admin/nav-links', label: 'Nav Links' },
    ],
  },
  {
    label: '',
    items: [
      { href: '/admin/media', label: 'Media Library' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setAdmin(getAdminUser());
    setChecked(true);
  }, [router]);

  if (!checked) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-faint">Checking session…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 overflow-y-auto border-r border-line bg-bg2 px-5 py-8">
        <Link href="/admin" className="font-serif-italic mb-10 block px-2 text-xl">
          Anvil <span className="text-accent">/ admin</span>
        </Link>
        <nav className="flex flex-col gap-5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-1">
              {group.label && (
                <div className="px-3 pb-1 text-[11px] uppercase tracking-wider text-faint">{group.label}</div>
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
          <span className="text-sm text-muted">Signed in as {admin?.name || admin?.email}</span>
          <button
            onClick={() => {
              clearAdminSession();
              router.replace('/admin/login');
            }}
            className="text-sm text-muted hover:text-accent"
          >
            Log out
          </button>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
