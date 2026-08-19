'use client';

import Image from 'next/image';
import type { ClientLogo } from '@/lib/api';

export function LogoMarquee({ logos }: { logos: ClientLogo[] }) {
  // Duplicate the list so the CSS animation can translate exactly -50% and loop seamlessly.
  const track = [...logos, ...logos];

  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee gap-16 group-hover:[animation-play-state:paused] md:gap-20">
        {track.map((logo, i) =>
          logo.logo_url ? (
            <div key={`${logo.id}-${i}`} className="relative h-8 w-28 shrink-0 opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
              <Image src={logo.logo_url} alt={logo.name} fill className="object-contain object-left" sizes="112px" />
            </div>
          ) : (
            <span key={`${logo.id}-${i}`} className="font-serif-italic shrink-0 whitespace-nowrap text-lg text-faint">
              {logo.name}
            </span>
          )
        )}
      </div>
    </div>
  );
}
