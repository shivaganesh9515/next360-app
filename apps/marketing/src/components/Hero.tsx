'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { durations, easings, staggers } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&q=80',
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const floatingCardRef = useRef<HTMLDivElement>(null);
  const ratingBadgeRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Master timeline
      const tl = gsap.timeline({ defaults: { ease: easings.easeOutExpo.gsap } });

      // Layer 0: Photo reveal
      const photo = sectionRef.current?.querySelector('.hero-photo');
      if (photo) {
        tl.fromTo(
          photo,
          { scale: 1.1, opacity: 0, filter: 'blur(8px)' },
          { scale: 1, opacity: 1, filter: 'blur(0)', duration: durations.cinema, ease: easings.easeOutCinematic.gsap },
          0
        );
      }

      // Layer 1: Rating badge
      if (ratingBadgeRef.current) {
        tl.fromTo(
          ratingBadgeRef.current,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: durations.slow },
          0.3
        );
      }

      // Layer 2: Headline panel content stagger
      const panelEls = panelRef.current?.querySelectorAll('.rv');
      if (panelEls?.length) {
        tl.fromTo(
          panelEls,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: durations.normal, stagger: staggers.normal },
          0.5
        );
      }

      // Layer 3: Floating card
      if (floatingCardRef.current) {
        tl.fromTo(
          floatingCardRef.current,
          { x: 60, y: 40, opacity: 0, rotate: 3 },
          { x: 0, y: 0, opacity: 1, rotate: 0, duration: durations.slow, ease: easings.easeOutExpo.gsap },
          0.8
        );
      }

      // Layer 4: Scroll cue
      if (scrollCueRef.current) {
        tl.fromTo(scrollCueRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: durations.normal }, 1.2);
      }

      // ScrollTrigger parallax on hero photo (subtle)
      if (photo) {
        gsap.to(photo, {
          y: '15%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden bg-brand-primary"
    >
      {/* ── LAYER 0: Full-bleed background photo ─────────────── */}
      <div className="hero-photo absolute inset-0 w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1600&q=85"
          alt="Fresh organic vegetables and produce at a local market in Hyderabad"
          fill
          className="object-cover"
          style={{ objectFit: 'cover' }}
          sizes="100vw"
          priority
          fetchPriority="high"
        />
        {/* Warm earth-tone duotone wash — multiply, not flat overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(22, 36, 28, 0.2)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* ── LAYER 1: Top-left rating badge ───────────────────── */}
      <div
        ref={ratingBadgeRef}
        className="absolute top-24 lg:top-28 left-6 lg:left-8 z-20"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-clay shadow-card">
          <span className="text-[10px] leading-none tracking-tighter text-brand-primary">★★★★★</span>
          <span className="text-[11px] font-semibold text-brand-primary leading-none whitespace-nowrap">
            4.8 rated by 10,000+ households
          </span>
        </div>
      </div>

      {/* ── LAYER 2: Center-left headline panel ──────────────── */}
      <div className="relative z-20 w-full h-full min-h-screen flex items-center">
        <div className="w-full max-w-container mx-auto px-6 lg:px-8">
        <div
          ref={panelRef}
          className="max-w-xl rounded-[40px] p-6 sm:p-8 lg:p-10 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(241, 239, 228, 0.82)' }}
          >
            {/* Headline */}
            <h1 className="rv font-display font-medium text-brand-primary leading-[0.92] tracking-tight"
                style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}>
              Fresh. Organic.<br />
              <span className="italic text-brand-accent">Delivered.</span>
            </h1>

            {/* Subhead */}
            <p className="rv text-text-secondary text-base sm:text-lg leading-relaxed mt-5 max-w-lg">
              India&apos;s trusted marketplace for verified organic groceries.
              Fresh produce from local sellers, delivered to your doorstep.
            </p>

            {/* CTA row */}
            <div className="rv flex flex-wrap items-center gap-3 sm:gap-4 pt-6">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
              >
                {/* App Store glyph */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {/* Play Store glyph */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.61 2.1c-.08.2-.11.42-.11.65v18.5c0 .23.03.45.11.65l10.3-9.9-10.3-9.9zM14.42 12.82l2.3 2.2 3.68-2.08c.54-.3.82-.78.82-1.28 0-.47-.26-.93-.72-1.2l-3.69-2.08-2.39 2.2v1.24zM4.46 21.96l9.36-9-1.4-1.34-7.96 10.34zM4.46 2.04l7.96 10.34 1.4-1.34-9.36-9z"/></svg>
                <span>Get the App</span>
              </a>
              <a
                href="#how-it-works"
                className="rv inline-flex px-6 py-3.5 rounded-full border border-brand-primary text-brand-primary text-sm font-semibold hover:bg-brand-primary/10 transition-all duration-300 backdrop-blur-sm"
              >
                Become a Seller
              </a>
            </div>

            {/* Avatar stack + social proof */}
            <div className="rv flex items-center gap-3 mt-6">
              <div className="flex -space-x-2.5">
                {avatars.map((src, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-neutral-bg overflow-hidden"
                  >
                    <Image
                      src={src}
                      alt=""
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
              <span className="text-text-secondary text-xs font-medium">
                Joined by <strong className="text-brand-primary">10,000+</strong> households across <strong className="text-brand-primary">3 cities</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYER 3: Bottom-right floating card (Elevate Agency) — hidden on mobile to avoid scroll cue collision ── */}
      <div
        ref={floatingCardRef}
        className="hidden sm:block absolute bottom-6 sm:bottom-10 right-6 lg:right-8 z-20"
      >
        <div className="relative w-[200px] sm:w-[240px] lg:w-[280px]">
          <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden shadow-card animate-badge-float">
            <Image
              src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&q=85"
              alt="Fresh organic vegetables in a wooden crate"
              fill
              className="object-cover"
              style={{ objectFit: 'cover' }}
              sizes="280px"
            />
            {/* Earth-tone wash */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: 'rgba(22, 36, 28, 0.08)',
                mixBlendMode: 'multiply',
              }}
            />
            {/* Stat pill on corner */}
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-moss/90 shadow-card">
              <span className="text-xs">🌱</span>
              <span className="text-[10px] font-semibold text-brand-primary whitespace-nowrap">
                500+ Verified Sellers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYER 4: Bottom-center scroll cue ────────────────── */}
      <div
        ref={scrollCueRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 animate-scroll-cue"
      >
        <span className="text-xs font-medium tracking-wider text-neutral-bg/70">
          Scroll to explore
        </span>
        <svg
          className="w-4 h-4 text-neutral-bg/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
