'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { durations, easings } from '@/lib/motion';

const testimonials = [
  {
    quote: 'I get fresh organic vegetables delivered in under 30 minutes. The quality is incredible and the tracking is seamless.',
    name: 'Priya M.',
    role: 'Customer, Hyderabad',
    image: 'https://images.unsplash.com/photo-1552848031-5e3a1f3c2b0e?w=800&q=80',
  },
  {
    quote: 'Next360 transformed my small organic store into a thriving business. My monthly revenue has doubled since joining the platform.',
    name: 'Arun K.',
    role: 'Seller, Karimnagar',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800&q=80',
  },
  {
    quote: 'Flexible deliveries, great earnings, and I get to serve my community. Being a delivery partner with Next360 changed my life.',
    name: 'Rahul S.',
    role: 'Delivery Partner, Vijayawada',
    image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80',
  },
];

function scrollRow(container: HTMLDivElement | null, direction: 'left' | 'right') {
  if (!container) return;
  const scrollAmount = container.clientWidth * 0.6;
  container.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  });
}

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <section id="testimonials" ref={ref} aria-labelledby="testimonials-heading" className="py-24 lg:py-32 px-6 lg:px-8 bg-neutral-bg overflow-hidden">
      <div className="max-w-container mx-auto">
        {/* sr-only heading per spec */}
        <h2 id="testimonials-heading" className="sr-only">
          What our community says
        </h2>

        {/* Scrollable row with arrow controls */}
        <div className="relative">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollRow(scrollRef.current, 'left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-neutral-bg/90 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-neutral-bg focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:outline-none transition-all duration-300 hidden sm:flex"
            aria-label="Scroll testimonials left"
          >
            <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Cards */}
          <div
            ref={scrollRef}
            tabIndex={0}
            className="flex gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:-mx-8 lg:px-8 scrollbar-hide focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:rounded-[24px] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') scrollRow(scrollRef.current, 'right');
              if (e.key === 'ArrowLeft') scrollRow(scrollRef.current, 'left');
            }}
          >
            {testimonials.map((t, i) => {
              // Curtain reveal — odd: clip from right, even: clip from left
              const fromRight = i % 2 === 0;
              return (
                <motion.div
                  key={t.name}
                  className="snap-start shrink-0 w-[320px] sm:w-[380px] lg:w-[440px] rounded-[24px] overflow-hidden relative group"
                  initial={{
                    opacity: 0,
                    clipPath: fromRight ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
                    y: 20,
                  }}
                  animate={
                    isInView
                      ? { opacity: 1, clipPath: 'inset(0 0 0 0)', y: 0 }
                      : {}
                  }
                  transition={{
                    duration: durations.slow,
                    delay: i * 0.2,
                    ease: easings.easeOutExpo.array,
                  }}
                >
                  {/* Background image */}
                  <div className="absolute inset-0">
                    <Image
                      src={t.image}
                      alt=""
                      fill
                      className="object-cover"
                      style={{ objectFit: 'cover' }}
                      sizes="440px"
                    />
                  </div>
                  {/* Translucent overlay */}
                  <div className="absolute inset-0 bg-brand-primary/60" />
                  {/* Content */}
                  <div className="relative z-10 p-8 lg:p-10 min-h-[320px] flex flex-col justify-end">
                    <p className="text-neutral-bg/90 text-sm sm:text-base leading-relaxed font-light italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 pt-4 border-t border-neutral-bg/20">
                      <p className="text-neutral-bg font-display font-semibold">
                        <cite className="not-italic">{t.name}</cite>
                      </p>
                      <p className="text-neutral-bg/60 text-xs mt-1">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => scrollRow(scrollRef.current, 'right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-neutral-bg/90 backdrop-blur-sm shadow-card flex items-center justify-center hover:bg-neutral-bg focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:outline-none transition-all duration-300 hidden sm:flex"
            aria-label="Scroll testimonials right"
          >
            <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
