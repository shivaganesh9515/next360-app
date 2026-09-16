'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings, staggers } from '@/lib/motion';

const cards = [
  {
    role: 'Customers',
    icon: '🛒',
    bg: 'bg-surface-moss',
    copy: 'Discover nearby organic stores, track deliveries in real-time, and enjoy fresh groceries at your doorstep.',
    steps: ['Discover', 'Order', 'Track', 'Enjoy'],
    cta: 'Explore categories',
    href: '#categories',
  },
  {
    role: 'Sellers',
    icon: '📦',
    bg: 'bg-surface-clay',
    copy: 'Register your store, get verified, manage inventory, and grow your business digitally with thousands of customers.',
    steps: ['Register', 'Get Verified', 'Sell', 'Grow'],
    cta: 'List Your Store',
    href: '/sellers',
  },
  {
    role: 'Delivery Partners',
    icon: '🛵',
    bg: 'bg-surface-bark',
    copy: 'Enjoy a flexible schedule, transparent earnings, and weekly payouts — all while serving your community.',
    steps: ['Register', 'Get Approved', 'Deliver', 'Earn'],
    cta: 'Start Earning',
    href: '/partners',
  },
];

export default function ThreeAudience() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="how-it-works" ref={ref} aria-labelledby="audiences-heading" className="py-24 lg:py-32 px-6 lg:px-8 bg-neutral-bg">
      <div className="max-w-container mx-auto">
        {/* Eyebrow / Section heading */}
        <motion.h2
          id="audiences-heading"
          className="text-center font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-brand-primary leading-[1.1] tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: durations.slow, ease: easings.easeOutCinematic.array }}
        >
          One Platform,{' '}
          <span className="text-brand-secondary italic">Three Journeys</span>
        </motion.h2>

        {/* Cards grid */}
        <div className="mt-14 lg:mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-5 xl:gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.role}
              className={`${card.bg} rounded-[24px] p-8 lg:p-10 flex flex-col`}
              initial={{ opacity: 0, y: 35 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: durations.slow,
                delay: i * staggers.normal,
                ease: easings.easeOutExpo.array,
              }}
            >
              <span className="text-2xl">{card.icon}</span>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-brand-primary mt-4">
                For {card.role}
              </h3>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                {card.copy}
              </p>

              {/* Steps */}
              <div className="flex items-center gap-2 mt-6 flex-wrap">
                {card.steps.map((step, si) => (
                  <span key={step} className="inline-flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-brand-primary">{step}</span>
                    {si < card.steps.length - 1 && (
                      <span className="text-brand-secondary/60 text-xs">→</span>
                    )}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-auto pt-6">
                <a
                  href={card.href}
                  className="inline-flex items-center text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors"
                >
                  {card.cta} <span className="ml-1.5">→</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
