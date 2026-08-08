'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings, staggers } from '@/lib/motion';

const stats = [
  { label: 'Verified Stores', value: 500, suffix: '+' },
  { label: 'Happy Households', value: 10000, suffix: '+' },
  { label: 'Cities Live', value: 3, suffix: '' },
  { label: 'Average Rating', value: 4.8, suffix: '★' },
];

function AnimatedStat({ target, suffix, label, isInView, delay }: {
  target: number; suffix: string; label: string; isInView: boolean; delay: number;
}) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isInView || startedRef.current) return;
    startedRef.current = true;
    const duration = 2000;
    const startTime = performance.now() + delay * 1000;
    const from = 0;
    const range = target - from;
    let rafId: number;

    function tick(now: number) {
      if (now < startTime) { rafId = requestAnimationFrame(tick); return; }
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(from + range * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, delay, target]);

  return (
    <div className="text-center">
      <p className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-neutral-bg leading-none tabular-nums">
        {target === 4.8 ? count.toFixed(1) : count.toLocaleString()}
        <span className="text-brand-secondary ml-1">{suffix}</span>
      </p>
      <p className="text-neutral-bg/60 text-sm mt-2 font-medium">{label}</p>
    </div>
  );
}

export default function StatsBand() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section ref={ref} className="py-20 lg:py-28 px-6 lg:px-8 bg-brand-primary overflow-hidden">
      <div className="max-w-container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="relative"
              initial={{
                opacity: 0,
                scale: 0.85,
                clipPath: 'inset(0 50% 0 50%)',
              }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      scale: 1,
                      clipPath: 'inset(0 0% 0 0%)',
                    }
                  : {}
              }
              transition={{
                duration: durations.slow,
                delay: i * staggers.normal,
                ease: easings.easeOutExpo.array,
              }}
            >
              <AnimatedStat
                target={s.value}
                suffix={s.suffix}
                label={s.label}
                isInView={isInView}
                delay={i * staggers.normal + 0.3}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
