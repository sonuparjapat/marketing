'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

// Splits "50+", "$2.4M", "218%", "3.4x" into a prefix, the numeric part, and a suffix so the
// digits can be tweened while the surrounding characters stay put.
function parseValue(raw: string) {
  const match = raw.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const decimals = numStr.includes('.') ? numStr.split('.')[1]?.length || 0 : 0;
  const num = parseFloat(numStr.replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return { prefix, suffix, num, decimals, hasComma: numStr.includes(',') };
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const parsed = parseValue(value);

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1.4, bounce: 0 });

  useEffect(() => {
    if (inView && parsed) motionValue.set(parsed.num);
  }, [inView, parsed, motionValue]);

  useEffect(() => {
    if (!parsed || !ref.current) return;
    return spring.on('change', (latest) => {
      if (!ref.current) return;
      const formatted = parsed.hasComma
        ? Math.round(latest).toLocaleString('en-IN')
        : latest.toFixed(parsed.decimals);
      ref.current.textContent = `${parsed.prefix}${formatted}${parsed.suffix}`;
    });
  }, [spring, parsed]);

  if (!parsed) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}0{parsed.suffix}
    </span>
  );
}
