'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings, staggers } from '@/lib/motion';

const principles = [
  { label: 'Premium', text: 'Handpicked organic produce from verified farms. Every product meets our quality standard.' },
  { label: 'Trustworthy', text: 'NPOP-certified sellers, KYC-verified vendors. Complete transparency from farm to table.' },
  { label: 'Fast', text: '30-minute delivery in your city. Real-time tracking from pickup to your doorstep.' },
  { label: 'Local', text: 'Supporting local farmers and businesses. Every order strengthens your community.' },
];

export default function PrinciplesSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="why" ref={ref} aria-labelledby="why-heading" className="py-28 lg:py-36 px-6 lg:px-8 bg-neutral-bg overflow-hidden">
      <div className="max-w-container mx-auto">
        {/* Headline with organic blob accents */}
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-surface-moss/60 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-surface-bark/40 blur-3xl" />

          <motion.p
            id="why-heading" className="relative font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-brand-primary leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: durations.slow, ease: easings.easeOutCinematic.array }}
          >
            Not just delivery.{' '}
            <span className="italic text-brand-secondary">Conscious commerce.</span>
          </motion.p>
        </div>

        {/* 4-column feature grid — no chrome, generous whitespace */}
        <div className="mt-16 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 xl:gap-12 max-w-5xl mx-auto">
          {principles.map((p, i) => (
            <motion.div
              key={p.label}
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: durations.normal,
                delay: i * staggers.normal,
                ease: easings.easeOut.array,
              }}
            >
              <h3 className="font-display text-lg font-semibold text-brand-primary">
                {p.label}
              </h3>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                {p.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
