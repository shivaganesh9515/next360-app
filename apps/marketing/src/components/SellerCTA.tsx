'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings, staggers } from '@/lib/motion';

export default function SellerCTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="grow" ref={ref} aria-labelledby="grow-heading" className="py-24 lg:py-32 px-6 lg:px-8 bg-neutral-bg">
      <div className="max-w-container mx-auto">
        {/* Split card wrapper — subtle perspective scale entrance */}
        <motion.div
          className="rounded-[24px] bg-surface-clay p-10 lg:p-14 xl:p-20 flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24 gap-10"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: durations.slow, ease: easings.easeOutExpo.array }}
        >
          {/* Left — slides in with editorial perspective */}
          <motion.div
            className="lg:w-[55%] space-y-6"
            initial={{ opacity: 0, x: -60, rotateY: -8 }}
            animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
            transition={{ duration: durations.slow, delay: 0.15, ease: easings.easeOutExpo.array }}
            style={{ perspective: '800px' }}
          >
            <h2 id="grow-heading" className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-brand-primary leading-[1.1] tracking-tight">
              Grow your business
              <br />
              <span className="italic text-brand-accent">with Next360.</span>
            </h2>
            <ul className="space-y-3">
              {[
                'Digital visibility — reach thousands of local customers',
                'Order management — accept, track, and fulfill seamlessly',
                'Fast settlements — weekly payouts directly to your account',
              ].map((item, i) => (
                <motion.li
                  key={item}
                  className="flex items-start gap-3 text-text-secondary text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: durations.normal,
                    delay: 0.3 + i * staggers.fast,
                    ease: easings.easeOut.array,
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-brand-secondary mt-2 shrink-0"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{
                      duration: durations.fast,
                      delay: 0.4 + i * staggers.fast,
                      ease: easings.easeOutExpo.array,
                    }}
                  />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right — slides in from right with slight skew */}
          <motion.div
            className="lg:w-[45%] flex flex-col items-start lg:items-end gap-4"
            initial={{ opacity: 0, x: 60, skewX: -3 }}
            animate={isInView ? { opacity: 1, x: 0, skewX: 0 } : {}}
            transition={{ duration: durations.slow, delay: 0.25, ease: easings.easeOutExpo.array }}
          >
            <a
              href="/sellers"
              className="inline-flex px-8 py-3.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
            >
              Apply as a Seller
            </a>
            <a
              href="/partners"
              className="inline-flex px-8 py-3.5 rounded-full border-2 border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary hover:text-neutral-bg transition-all duration-300"
            >
              Apply as Delivery Partner
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
