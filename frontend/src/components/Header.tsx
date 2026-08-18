'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavLink } from '@/lib/api';

const FALLBACK_NAV: Pick<NavLink, 'href' | 'label'>[] = [
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function Header({
  agencyName = 'Anvil',
  navLinks,
}: {
  agencyName?: string;
  navLinks?: Pick<NavLink, 'href' | 'label'>[];
}) {
  const [open, setOpen] = useState(false);
  const nav = navLinks && navLinks.length > 0 ? navLinks : FALLBACK_NAV;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1312px] items-center justify-between px-6 py-5 md:px-16">
        <Link href="/" className="font-serif-italic text-2xl">
          {agencyName}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted transition-colors hover:text-fg">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="hidden rounded-sm bg-accent px-6 py-2.5 text-sm font-bold text-bg transition-opacity hover:opacity-90 md:inline-block"
          >
            Get Free Audit
          </Link>
          <button
            aria-label="Toggle menu"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`h-px w-6 bg-fg transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-fg transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`h-px w-6 bg-fg transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 pb-6 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-sm text-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="mt-2 rounded-sm bg-accent px-6 py-3 text-center text-sm font-bold text-bg">
            Get Free Audit
          </Link>
        </nav>
      )}
    </header>
  );
}
