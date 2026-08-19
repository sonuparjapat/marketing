'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { Banner } from '@/lib/api';
import { ArrowRightIcon } from '@/components/icons';

export function HeroBannerSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [paused, banners.length]);

  const banner = banners[index];
  if (!banner) return null;

  return (
    <div
      className="group relative h-[560px] w-full overflow-hidden rounded-2xl border border-line-soft md:h-[620px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image src={banner.image_url} alt={banner.title} fill className="object-cover" sizes="100vw" priority={index === 0} />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
          <div className="relative flex h-full max-w-[560px] flex-col justify-end p-8 md:p-14">
            {banner.tag_label && (
              <span className="mb-4 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] uppercase tracking-wide text-fg backdrop-blur-sm">
                {banner.tag_label}
              </span>
            )}
            <h2 className="font-serif mb-3 text-3xl font-normal leading-tight text-fg md:text-[42px]">{banner.title}</h2>
            {banner.subtitle && <p className="mb-6 max-w-[440px] text-[14.5px] leading-relaxed text-muted">{banner.subtitle}</p>}
            {banner.button_label && banner.button_link && (
              <Link
                href={banner.button_link}
                className="group/btn inline-flex w-fit items-center gap-2.5 bg-accent px-6 py-3.5 text-sm font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_var(--accent)]"
              >
                {banner.button_label}
                <ArrowRightIcon size={15} className="transition-transform group-hover/btn:translate-x-1" />
              </Link>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <div className="absolute inset-x-0 top-0 z-10 flex gap-1.5 p-4">
            {banners.map((b, i) => (
              <div key={b.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
                {i === index && !paused && (
                  <motion.div
                    key={`${b.id}-${index}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 6, ease: 'linear' }}
                    className="h-full bg-accent"
                  />
                )}
                {i < index && <div className="h-full w-full bg-accent" />}
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 right-6 z-10 flex gap-2">
            <button
              aria-label="Previous slide"
              onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-fg backdrop-blur-sm transition-colors hover:bg-accent hover:text-bg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              aria-label="Next slide"
              onClick={() => setIndex((i) => (i + 1) % banners.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-fg backdrop-blur-sm transition-colors hover:bg-accent hover:text-bg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
