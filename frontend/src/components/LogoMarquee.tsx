'use client';

import Image from 'next/image';
import type { ClientLogo } from '@/lib/api';

export function LogoMarquee({ logos }: { logos: ClientLogo[] }) {
  // Duplicate the list so the CSS animation can translate exactly -50% and loop seamlessly.
  const track = [...logos, ...logos];

  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
        {track.map((logo, i) =>
          logo.logo_url ? (
            <div
              key={`${logo.id}-${i}`}
              className="flex h-16 w-44 shrink-0 items-center justify-center rounded-xl border border-line-soft bg-white/[0.025] px-6 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/[0.06]"
            >
              <div className="relative h-7 w-full opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <Image src={logo.logo_url} alt={logo.name} fill className="object-contain" sizes="140px" />
              </div>
            </div>
          ) : (
            <span
              key={`${logo.id}-${i}`}
              className="flex h-16 w-44 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-line-soft bg-white/[0.025] text-sm font-bold tracking-wide text-faint transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:text-fg"
            >
              {logo.name}
            </span>
          )
        )}
      </div>
    </div>
  );
}
