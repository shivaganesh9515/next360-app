'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { durations, easings } from '@/lib/motion';

const categories = [
  { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80', tint: 'rgba(22,36,28,0.15)' },
  { name: 'Fruits', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=80', tint: 'rgba(75,94,63,0.18)' },
  { name: 'Dairy', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80', tint: 'rgba(22,36,28,0.12)' },
  { name: 'Snacks', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80', tint: 'rgba(75,94,63,0.15)' },
  { name: 'Natural Products', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&q=80', tint: 'rgba(22,36,28,0.13)' },
  { name: 'Eco-Friendly', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb478b12?w=600&q=80', tint: 'rgba(75,94,63,0.18)' },
];

function scrollRow(container: HTMLDivElement | null, direction: 'left' | 'right') {
  if (!container) return;
  const scrollAmount = container.clientWidth * 0.6;
  container.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  });
}

export default function ProductShowcase() {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="categories" ref={ref} aria-labelledby="categories-heading" className="py-24 lg:py-32 px-6 lg:px-8 bg-neutral-surface overflow-hidden">
      <div className="max-w-container mx-auto">
        <motion.h2
          id="categories-heading"
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-brand-primary leading-[1.1] tracking-tight text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: durations.slow, ease: easings.easeOutCinematic.array }}
        >
          Certified organic,{' '}
          <span className="italic text-brand-secondary">every category.</span>
        </motion.h2>

        {/* Scrollable row with arrow controls */}
        <div className="relative mt-12 lg:mt-16">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollRow(scrollRef.current, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-neutral-bg/90 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-neutral-bg focus-visible:bg-neutral-bg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-accent opacity-0 group-hover/row:opacity-100 transition-all duration-300 hidden sm:flex"
            aria-label="Scroll categories left"
          >
            <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Cards */}
          <div
            ref={scrollRef}
            tabIndex={0}
            className="flex gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 scrollbar-hide group/row focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:rounded-[16px] focus:outline-none"
            role="list"
            aria-label="Product categories"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') scrollRow(scrollRef.current, 'right');
              if (e.key === 'ArrowLeft') scrollRow(scrollRef.current, 'left');
            }}
          >
            {categories.map((cat) => (
              <div
                key={cat.name}
                role="listitem"
                className="snap-start shrink-0 w-[220px] sm:w-[260px] lg:w-[300px] rounded-[16px] overflow-hidden group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[16px]">
                  <Image
                    src={cat.image}
                    alt={`Fresh organic ${cat.name.toLowerCase()} delivered in Hyderabad, Karimnagar, Vijayawada`}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    style={{ mixBlendMode: 'multiply' }}
                    sizes="300px"
                  />
                  {/* Earth-tone duotone overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ backgroundColor: cat.tint, mixBlendMode: 'multiply' }}
                  />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-brand-primary/60 to-transparent">
                    <span className="text-neutral-bg font-display text-lg font-semibold">
                      {cat.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scrollRow(scrollRef.current, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-neutral-bg/90 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-neutral-bg focus-visible:bg-neutral-bg focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-accent opacity-0 group-hover/row:opacity-100 transition-all duration-300 hidden sm:flex"
            aria-label="Scroll categories right"
          >
            <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
