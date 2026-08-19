'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NavLink } from '@/lib/api';
import { ArrowRightIcon, UserIcon } from '@/components/icons';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { AuthDrawer } from '@/components/AuthDrawer';

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
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();
  const nav = navLinks && navLinks.length > 0 ? navLinks : FALLBACK_NAV;
  const { customer, loading, logout } = useCustomerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <>
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? 'border-line bg-bg/90 backdrop-blur-md' : 'border-transparent bg-bg/40 backdrop-blur-sm'
      }`}
    >
      <div className={`mx-auto flex max-w-[1312px] items-center justify-between px-6 transition-[padding] duration-300 md:px-16 ${scrolled ? 'py-4' : 'py-5'}`}>
        <Link href="/" className="group flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent transition-transform group-hover:scale-125" />
          <span className="font-serif-italic text-2xl">{agencyName}</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="group relative py-1 text-sm text-muted transition-colors hover:text-fg">
                <span className={active ? 'text-fg' : ''}>{item.label}</span>
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {!loading &&
            (customer ? (
              <div className="hidden items-center gap-3 md:flex">
                <span className="text-sm text-muted">Hi, {customer.name.split(' ')[0]}</span>
                <button onClick={logout} className="text-sm text-muted hover:text-accent">
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Sign in"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent md:flex"
              >
                <UserIcon size={16} />
              </button>
            ))}
          <Link
            href="/contact"
            className="group hidden items-center gap-2 rounded-sm bg-accent px-6 py-2.5 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-[0_8px_24px_-8px_var(--accent)] md:inline-flex"
          >
            Get Free Audit
            <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`h-px w-6 bg-fg transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-fg transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`h-px w-6 bg-fg transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 pb-6 pt-2">
              {nav.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Link
                    href={item.href}
                    className={`block py-3 text-sm ${isActive(item.href) ? 'text-accent' : 'text-muted'}`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <Link href="/contact" className="mt-3 rounded-sm bg-accent px-6 py-3 text-center text-sm font-bold text-bg">
                Get Free Audit
              </Link>
              {!loading &&
                (customer ? (
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-sm text-muted">Signed in as {customer.name}</span>
                    <button onClick={logout} className="text-sm text-accent">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="mt-4 border-t border-line pt-4 text-left text-sm text-muted hover:text-accent"
                  >
                    Sign in / Create account
                  </button>
                ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

    </header>
    <AuthDrawer open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
