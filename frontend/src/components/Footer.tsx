import Link from 'next/link';
import type { PublicSettings, NavLink } from '@/lib/api';
import { getServices } from '@/lib/api';
import { InstagramIcon, LinkedinIcon, YoutubeIcon, TwitterIcon } from './icons';
import { NewsletterForm } from './NewsletterForm';

const FALLBACK_FOOTER_NAV: Pick<NavLink, 'href' | 'label'>[] = [
  { href: '/about', label: 'About' },
  { href: '/work', label: 'Our Work' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export async function Footer({
  settings,
  navLinks,
}: {
  settings: PublicSettings;
  navLinks?: Pick<NavLink, 'href' | 'label'>[];
}) {
  const agencyName = settings.agency_name || 'Anvil Digital';
  const year = new Date().getFullYear();
  const footerNav = navLinks && navLinks.length > 0 ? navLinks : FALLBACK_FOOTER_NAV;
  const services = await getServices();

  return (
    <footer className="px-6 pb-8 pt-20 md:px-16">
      <div className="mx-auto grid max-w-[1312px] grid-cols-1 gap-12 border-b border-line pb-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="font-serif-italic mb-4 text-2xl">{agencyName}</div>
          <p className="mb-6 max-w-[280px] text-sm leading-relaxed text-muted">
            {settings.tagline || "A performance marketing agency for D2C & SME brands in India."}
          </p>
          <NewsletterForm />
        </div>

        <div>
          <div className="mb-5 text-xs uppercase tracking-wider text-faint">Company</div>
          <div className="flex flex-col gap-3 text-sm text-muted">
            {footerNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5 text-xs uppercase tracking-wider text-faint">Services</div>
          <div className="flex flex-col gap-3 text-sm text-muted">
            {services.length > 0
              ? services.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/services/${s.slug}`}>
                    {s.title}
                  </Link>
                ))
              : <Link href="/services">All services</Link>}
          </div>
        </div>

        <div>
          <div className="mb-5 text-xs uppercase tracking-wider text-faint">Get in touch</div>
          <div className="mb-2 text-sm text-muted">{settings.email || 'hello@anvil.agency'}</div>
          <div className="mb-5 text-sm text-muted">{settings.phone || '+91 98XXX XXXXX'}</div>
          <div className="flex gap-3.5">
            {settings.instagram_url && (
              <a href={settings.instagram_url} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted">
                <InstagramIcon size={16} />
              </a>
            )}
            {settings.linkedin_url && (
              <a href={settings.linkedin_url} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted">
                <LinkedinIcon size={16} />
              </a>
            )}
            {settings.youtube_url && (
              <a href={settings.youtube_url} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted">
                <YoutubeIcon size={16} />
              </a>
            )}
            {settings.twitter_url && (
              <a href={settings.twitter_url} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted">
                <TwitterIcon size={16} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1312px] flex-col items-center gap-4 pt-7 text-xs text-faint md:flex-row md:justify-between">
        <span>
          &copy; {year} {agencyName}. All rights reserved.
        </span>
        <div className="flex gap-7">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
