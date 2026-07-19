'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Leaf, Recycle, Sprout } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Section } from './ui/section';

interface StorefrontCard {
  name: string;
  tagline: string;
  accent: string;
  tint: string;
  border: string;
  icon: typeof Leaf;
}

const storefronts: StorefrontCard[] = [
  {
    name: 'Organic',
    tagline: 'Certified organic produce, direct from farm.',
    accent: '#5C6B4D',
    tint: '#EDF0E8',
    border: 'rgba(92,107,77,0.3)',
    icon: Leaf,
  },
  {
    name: 'Natural',
    tagline: 'Traditional, chemical-free everyday essentials.',
    accent: '#9B6A3F',
    tint: '#F4ECE3',
    border: 'rgba(155,106,63,0.3)',
    icon: Sprout,
  },
  {
    name: 'Eco-Friendly',
    tagline: 'Sustainable products for a lighter footprint.',
    accent: '#2F5D62',
    tint: '#E7EEEE',
    border: 'rgba(47,93,98,0.3)',
    icon: Recycle,
  },
];

/* ── Single card with scroll-driven parallax ───────────────────── */
function ParallaxCard({
  store,
  index,
}: {
  store: StorefrontCard;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollReveal(cardRef);
  const prefersReduced = usePrefersReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafId = useRef<number>(0);

  /* Throttled scroll listener via requestAnimationFrame */
  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = 1 - (rect.top + rect.height) / (viewH + rect.height);
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    });
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll, prefersReduced]);

  /* Stagger delay based on index */
  const staggerDelay = prefersReduced ? 0 : index * 120;

  /* Parallax values — zeroed out when reduced motion preferred */
  const translateY = prefersReduced ? 0 : isVisible ? 0 : 60;
  const opacity = isVisible ? 1 : 0;
  const rotateX = prefersReduced ? 0 : (scrollProgress - 0.5) * 6;
  const imageParallax = prefersReduced ? 0 : (scrollProgress - 0.5) * -20;

  return (
    <div
      ref={cardRef}
      className="group relative"
      style={{
        opacity,
        transform: `translateY(${translateY}px) perspective(800px) rotateX(${rotateX}deg)`,
        transition: prefersReduced
          ? 'opacity 0.2s ease'
          : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms`,
        transformOrigin: 'center bottom',
      }}
    >
      <a
        href="#"
        className="group/card relative block rounded-2xl overflow-hidden border p-8 transition-all duration-250 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        style={{
          borderColor: store.border,
          background: `linear-gradient(145deg, ${store.tint}, var(--background) 75%)`,
          transform: `translateY(${imageParallax * -0.5}px)`,
        }}
      >
        {/* Bold icon tile — the Next360 equivalent of Zomato's app-icon cards */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mb-6 transition-transform duration-300 group-hover/card:scale-105 group-hover/card:-rotate-3"
          style={{ backgroundColor: store.accent }}
        >
          <store.icon className="w-7 h-7 text-white" strokeWidth={1.75} />
        </div>

        {/* Accent stripe on reveal */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{
            backgroundColor: store.accent,
            transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: prefersReduced
              ? 'transform 0.2s ease'
              : `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 200}ms`,
          }}
        />

        <h3 className="font-display text-2xl font-bold mb-2" style={{ color: store.accent }}>
          {store.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{store.tagline}</p>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover/card:gap-2.5"
          style={{ color: store.accent }}
        >
          Explore
          <ArrowRight className="w-4 h-4" />
        </span>
      </a>
    </div>
  );
}

/* ── Section header with parallax ──────────────────────────────── */
function SectionHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useScrollReveal(ref, { threshold: 0.3 });
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div
      ref={ref}
      className="text-center mb-16"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: prefersReduced
          ? 'opacity 0.2s ease'
          : 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
        Three storefronts, one app
      </h2>
      <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
        Each curated for a different kind of conscious shopper.
      </p>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function StorefrontShowcase() {
  return (
    <Section id="storefronts">
      <div className="max-w-container mx-auto">
        <SectionHeader />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storefronts.map((store, i) => (
            <ParallaxCard key={store.name} store={store} index={i} />
          ))}
        </div>
      </div>
    </Section>
  );
}
