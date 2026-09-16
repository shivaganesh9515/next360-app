'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { durations, easings, staggers } from '@/lib/motion';

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  const columns = [
    {
      title: 'Next360',
      items: [
        'India\u2019s trusted organic marketplace \u2014 connecting customers, sellers, and delivery partners for fresh, verified organic groceries.',
      ],
      type: 'brand' as const,
    },
    {
      title: 'For Customers',
      items: [
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Categories', href: '/#categories' },
        { label: 'Why Next360', href: '/#why' },
        { label: 'FAQ', href: '/#faq' },
      ],
      type: 'links' as const,
    },
    {
      title: 'For Sellers',
      items: [
        { label: 'Become a seller', href: '/sellers' },
        { label: 'Payouts', href: '/sellers#payouts' },
        { label: 'Seller FAQ', href: '/sellers#faq' },
        { label: 'Contact onboarding', href: 'mailto:support@next360.com?subject=Seller%20application%20—%20Next360' },
      ],
      type: 'links' as const,
    },
    {
      title: 'For Delivery Partners',
      items: [
        { label: 'Become a partner', href: '/partners' },
        { label: 'Earnings', href: '/partners#earnings' },
        { label: 'Partner FAQ', href: '/partners#faq' },
        { label: 'Contact onboarding', href: 'mailto:support@next360.com?subject=Delivery%20partner%20application%20—%20Next360' },
      ],
      type: 'links' as const,
    },
  ];

  return (
    <footer
      id="footer"
      ref={ref}
      className="bg-brand-primary text-text-on-dark px-6 lg:px-8 pt-20 pb-10"
    >
      <div className="max-w-container mx-auto">
        {/* Top — columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-14 border-b border-white/10">
          {columns.map((col, colIndex) => (
            <motion.div
              key={col.title}
              className="space-y-4"
              initial={{ opacity: 0, y: 30, clipPath: 'inset(0 0 100% 0)' }}
              animate={
                isInView
                  ? { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }
                  : {}
              }
              transition={{
                duration: durations.slow,
                delay: colIndex * staggers.normal,
                ease: easings.easeOutExpo.array,
              }}
            >
              {col.type === 'brand' ? (
                <>
                  <span className="font-display font-semibold text-xl text-text-on-dark">
                    {col.title}
                  </span>
                  <p className="text-text-on-dark/50 text-sm leading-relaxed max-w-xs">
                    {col.items[0]}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    {['Hyderabad', 'Karimnagar', 'Vijayawada'].map((city) => (
                      <span
                        key={city}
                        className="text-text-on-dark/40 text-xs font-medium tracking-wide"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-display font-semibold text-sm text-text-on-dark mb-4">
                    {col.title}
                  </h4>
                  <ul className="space-y-2.5">
                    {col.items.map((link, linkIndex) => (
                      <motion.li
                        key={link.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{
                          duration: durations.fast,
                          delay: colIndex * staggers.normal + 0.15 + linkIndex * 0.05,
                          ease: easings.easeOut.array,
                        }}
                      >
                        <a
                          href={link.href}
                          className="text-text-on-dark/50 text-sm hover:text-text-on-dark/80 transition-colors"
                        >
                          {link.label}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom — newsletter + legal */}
        <motion.div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: durations.normal,
            delay: 0.6,
            ease: easings.easeOut.array,
          }}
        >
          <div className="w-full sm:w-auto">
            <a
              href="mailto:support@next360.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-text-on-dark text-sm hover:border-brand-accent transition-colors"
            >
              Contact us: support@next360.com
            </a>
          </div>

          <div className="flex items-center gap-6 text-text-on-dark/30 text-xs">
            <a href="/sitemap.xml" className="sr-only focus:not-sr-only focus:absolute focus:text-text-on-dark/60" aria-label="Sitemap">
              Sitemap
            </a>
            <a href="/privacy" className="hover:text-text-on-dark/60 transition-colors">
              Privacy
            </a>
            <span>&copy; {new Date().getFullYear()} Next360</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
