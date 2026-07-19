'use client';

import { useRef } from 'react';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import Glow from './ui/glow';
import { Section } from './ui/section';

/* A decorative floating swatch tile — the Next360 equivalent of Zomato's
   floating cutout food photography (we have no real product photography
   yet, so real texture swatches stand in, in the same compositional role). */
function FloatingTile({
  pattern,
  className,
  delay,
  rotate = 0,
}: {
  pattern: 'swatch-moss' | 'swatch-clay' | 'swatch-eucalyptus';
  className: string;
  delay: number;
  rotate?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useScrollReveal(ref, { threshold: 0.2 });
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`absolute rounded-2xl ${pattern} border border-border shadow-md ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? `scale(1) rotate(${rotate}deg)` : `scale(0.7) rotate(${rotate}deg)`,
        transition: prefersReduced
          ? 'opacity 0.2s ease'
          : `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    />
  );
}

export default function Mission() {
  const headingRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollReveal(headingRef, { threshold: 0.3 });
  const prefersReduced = usePrefersReducedMotion();

  const fade = (delay: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: prefersReduced
      ? 'opacity 0.2s ease'
      : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <Section id="mission" className="relative overflow-hidden py-24 sm:py-36">
      {/* Thin decorative line art, echoing Zomato's squiggle paths but in
          a single hairline brass tone rather than a saturated brand color */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.25]"
        viewBox="0 0 1280 500"
        preserveAspectRatio="none"
      >
        <path
          d="M -50 80 C 150 20, 250 220, 100 260 S 20 420, 220 380"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.5"
        />
        <path
          d="M 1330 60 C 1130 0, 1080 200, 1230 220 S 1300 400, 1080 360"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.5"
        />
      </svg>

      <Glow variant="center" />

      <FloatingTile pattern="swatch-moss" className="hidden md:block w-36 h-36 top-10 left-[3%]" delay={0} rotate={-8} />
      <FloatingTile pattern="swatch-clay" className="hidden lg:block w-24 h-24 top-[58%] left-[10%]" delay={150} rotate={12} />
      <FloatingTile pattern="swatch-eucalyptus" className="hidden md:block w-32 h-32 top-6 right-[4%]" delay={100} rotate={10} />
      <FloatingTile pattern="swatch-moss" className="hidden lg:block w-20 h-20 bottom-8 right-[12%]" delay={250} rotate={-14} />

      <div ref={headingRef} className="max-w-container mx-auto relative z-10 text-center">
        <h2
          className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-tight text-balance"
          style={{ ...fade(0), color: 'var(--brand)' }}
        >
          Better groceries,
          <br />
          closer to home.
        </h2>
        <p
          className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed"
          style={fade(150)}
        >
          We&apos;re building a marketplace where every vendor is verified, every product
          has a story, and every order supports a business in your own city.
        </p>
      </div>
    </Section>
  );
}
