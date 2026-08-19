'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { StarIcon } from '@/components/icons';
import type { Testimonial } from '@/lib/api';

export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || testimonials.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 5500);
    return () => clearInterval(id);
  }, [paused, testimonials.length]);

  const t = testimonials[index];
  if (!t) return null;

  return (
    <div
      className="mx-auto max-w-[720px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[260px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="mb-5 flex justify-center gap-1 text-accent">
              {Array.from({ length: t.rating }).map((_, idx) => (
                <StarIcon key={idx} size={16} />
              ))}
            </div>
            <p className="font-serif-italic mb-7 text-xl leading-relaxed md:text-2xl">&ldquo;{t.review}&rdquo;</p>
            <div className="flex items-center justify-center gap-3">
              {t.client_photo ? (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-line">
                  <Image src={t.client_photo} alt={t.client_name} fill className="object-cover" sizes="44px" />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-sm font-bold text-accent">
                  {t.client_name.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-bold">{t.client_name}</div>
                <div className="text-xs text-faint">
                  {[t.client_designation, t.client_company].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-10 flex justify-center gap-2.5">
          {testimonials.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-accent' : 'w-1.5 bg-line hover:bg-faint'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
