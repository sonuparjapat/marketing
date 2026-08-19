'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const { show } = useToast();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    show('Link copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  const links = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs uppercase tracking-wider text-faint">Share</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-line px-3.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
        >
          {l.label}
        </a>
      ))}
      <button
        onClick={copyLink}
        className="border border-line px-3.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
