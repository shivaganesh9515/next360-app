'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings } from '@/lib/motion';

const faqs = [
  {
    persona: 'Customer',
    q: 'How do I start ordering on Next360?',
    a: 'Create an account in the customer app, set your delivery location, and start browsing products from verified organic sellers across multiple storefronts.',
  },
  {
    persona: 'Customer',
    q: 'How does delivery tracking work?',
    a: 'Once your order is confirmed, you can track it in real-time from the app. You\'ll receive live updates when the order is picked up, en route, and delivered to your doorstep.',
  },
  {
    persona: 'Seller',
    q: 'What do I need to register my store?',
    a: 'You need a registered business, product list, and valid certifications. Our team verifies each store before it goes live. Once approved, you can start listing products and receiving orders.',
  },
  {
    persona: 'Seller',
    q: 'How do payouts work for sellers?',
    a: 'Earnings are settled to your linked account on a regular cycle. You can track your earnings, pending settlements, and payout history from your vendor dashboard. Exact terms are confirmed during onboarding.',
  },
  {
    persona: 'Delivery Partner',
    q: 'What are the requirements to deliver?',
    a: 'You need a valid ID proof, a smartphone, and a vehicle (bicycle, scooter, or bike). Complete the verification process, and you can start accepting deliveries once approved.',
  },
  {
    persona: 'Delivery Partner',
    q: 'How much can I earn as a partner?',
    a: 'Earnings depend on the deliveries you complete, distance, and any active incentives. You get paid per delivery plus incentives for peak hours and high ratings. Exact rates are shared during onboarding.',
  },
];

const personaColors: Record<string, string> = {
  Customer: 'text-brand-secondary',
  Seller: 'text-brand-secondary',
  'Delivery Partner': 'text-brand-primary',
};

export default function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="faq" ref={ref} className="py-24 lg:py-32 px-6 lg:px-8 bg-neutral-surface">
      {/* FAQPage JSON-LD for SERP visibility */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
      <div className="max-w-container mx-auto max-w-3xl">
        <motion.h2
          id="faq-heading"
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-brand-primary leading-[1.1] tracking-tight text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: durations.slow, ease: easings.easeOutCinematic.array }}
        >
          Frequently asked{' '}
          <span className="italic text-brand-secondary">questions.</span>
        </motion.h2>

        <motion.div
          className="mt-12 lg:mt-16 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: durations.normal, delay: 0.2, ease: easings.easeOut.array }}
        >
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-[16px] bg-neutral-bg border border-neutral-surface overflow-hidden transition-all duration-300 open:shadow-card"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none marker:hidden">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${personaColors[faq.persona]}`}>
                    {faq.persona}
                  </span>
                  <span className="text-sm font-medium text-brand-primary">{faq.q}</span>
                </div>
                <svg
                  className="w-4 h-4 text-text-secondary shrink-0 transition-transform duration-300 group-open:rotate-45"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </summary>
              <div className="px-6 pb-4 pt-0">
                <p className="text-text-secondary text-sm leading-relaxed pl-[70px]">
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
