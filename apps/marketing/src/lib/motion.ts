/* ══════════════════════════════════════════════════════════════════
   NEXT360 — Motion Language
   
   This file is the single source of truth for every animation
   on the website. No component should define its own easing curves,
   durations, or animation patterns outside of what is defined here.
   
   Principles:
   • Motion is never decorative — it guides attention and tells a story.
   • Every animation feels organic, confident, and intentional.
   • No bounce, no elastic, no overshoot, no cartoon motion.
   • Scrolling feels like watching a film — gradual, cinematic.
   • The user notices how the website feels, not how it animates.
   
   References: Apple (restraint), Linear (precision), Stripe (fluidity),
   Arc Browser (intent), Aesop (natural), Nothing (minimalism)
   ══════════════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────────
   1. EASING SYSTEM
   
   Every animation uses one of these five curves. Nothing else.
   
   Two formats are provided for each:
   - `array` — for Framer Motion's `ease` prop
   - `gsap` — for GSAP's `ease` string (compatible with CustomEase plugin)
   
   • easeOutExpo — the hero ease. Smooth deceleration from fast to rest.
   • easeOut — standard ease-out for micro-interactions.
   • easeInOut — for bidirectional state transitions.
   • easeIn — for exit animations (use sparingly).
   • easeOutCinematic — ultra-smooth for large-scale reveals.
   ──────────────────────────────────────────────────────────────── */

export const easings = {
  easeOutExpo: {
    array: [0.16, 1, 0.3, 1] as const,
    gsap: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  easeOut: {
    array: [0.25, 0.1, 0.25, 1] as const,
    gsap: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  easeInOut: {
    array: [0.65, 0, 0.35, 1] as const,
    gsap: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
  easeIn: {
    array: [0.55, 0.055, 0.675, 0.19] as const,
    gsap: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  },
  easeOutCinematic: {
    array: [0.06, 0.7, 0.1, 1] as const,
    gsap: 'cubic-bezier(0.06, 0.7, 0.1, 1)',
  },
} as const;

export type EasingKey = keyof typeof easings;

/* ────────────────────────────────────────────────────────────────
   2. TIMING SCALE
   
   Every animation maps to one of these duration buckets.
   Nothing is invented ad-hoc.
   
   micro  →  150ms  — instant feedback (button hover, border)
   fast   →  300ms  — quick interactions (card hover, link)
   normal →  500ms  — standard reveals (section entry, content)
   slow   →  800ms  — substantial reveals (hero, photography)
   cinema → 1400ms  — cinematic moments (hero headline, full-bleed)
   ──────────────────────────────────────────────────────────────── */

export const durations = {
  micro: 0.15,
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  cinema: 1.4,
} as const;

export type DurationKey = keyof typeof durations;

/* ────────────────────────────────────────────────────────────────
   3. STAGGER SCALE
   
   fast    →  40ms   — rapid stagger (grid items, feature cards)
   normal  →  80ms   — standard stagger (store list, step list)
   slow    →  150ms  — deliberate stagger (hero lines, sections)
   spread  →  300ms  — wide stagger (multi-section reveals)
   ──────────────────────────────────────────────────────────────── */

export const staggers = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.15,
  spread: 0.3,
} as const;

export type StaggerKey = keyof typeof staggers;

/* ────────────────────────────────────────────────────────────────
   4. SCROLL CHOREOGRAPHY
   
   Every section uses a unique entrance animation. 
   This map provides the default animation config for each section.
   A section's `id` attribute maps to one of these entries.
   
   No two consecutive sections share the same pattern.
   ──────────────────────────────────────────────────────────────── */

export const scrollEntries = {
  hero: {
    easing: 'easeOutExpo' as EasingKey,
    duration: 'cinema' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 60,
    description: 'Cinematic GSAP timeline: photo → lines → live → search → CTA',
  },
  editorial: {
    easing: 'easeOutCinematic' as EasingKey,
    duration: 'slow' as DurationKey,
    stagger: 'spread' as StaggerKey,
    distance: 40,
    description: 'Centered fade-up with hairline divider scale reveal',
  },
  photographySpread: {
    easing: 'easeOutCinematic' as EasingKey,
    duration: 'cinema' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 0,
    scale: 1.15,
    description: 'Clip-path vertical wipe + scale-down reveal',
  },
  offsetComposition: {
    easing: 'easeOutExpo' as EasingKey,
    duration: 'slow' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 40,
    description: 'Alternating slideFrom left/right per row',
  },
  staggeredTimeline: {
    easing: 'easeOutExpo' as EasingKey,
    duration: 'slow' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 30,
    description: 'Staggered single-column, items alternate from opposite sides',
  },
  grid: {
    easing: 'easeOut' as EasingKey,
    duration: 'normal' as DurationKey,
    stagger: 'fast' as StaggerKey,
    distance: 20,
    description: 'Rapid fade-up grid entries',
  },
  photographyInterlude: {
    easing: 'easeOutCinematic' as EasingKey,
    duration: 'cinema' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 30,
    scale: 1.15,
    description: 'Scale-in reveal (different from wipe above)',
  },
  sideBySide: {
    easing: 'easeOutExpo' as EasingKey,
    duration: 'slow' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 20,
    description: 'Opposing slideFrom left (image) + right (text)',
  },
  cta: {
    easing: 'easeOutExpo' as EasingKey,
    duration: 'slow' as DurationKey,
    stagger: 'slow' as StaggerKey,
    distance: 30,
    description: 'Centered fade-up with staggered children',
  },
} as const;

export type ScrollEntryKey = keyof typeof scrollEntries;

/* ────────────────────────────────────────────────────────────────
   5. HOVER BEHAVIORS
   
   Every interactive element maps to one of these patterns.
   ──────────────────────────────────────────────────────────────── */

export const hoverBehaviors = {
  /** Text link — simple color transition */
  link: {
    css: 'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  },

  /** Primary button — subtle lift + shadow deepening */
  button: {
    scale: 1.02,
    shadow: true,
    css: 'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:scale-[1.02] active:scale-[0.98]',
  },

  /** Card or tile — lift + shadow + content shift */
  card: {
    y: -4,
    shadow: true,
    css: 'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:-translate-y-1',
  },

  /** Image — subtle zoom */
  image: {
    scale: 1.03,
    brightness: 1.05,
    css: 'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:scale-[1.03]',
  },

  /** Magnetic pull — spring physics */
  magnetic: {
    strength: 0.2,
    springStiffness: 150,
    springDamping: 15,
  },
} as const;

/* ────────────────────────────────────────────────────────────────
   6. FADE VARIANTS (Framer Motion)
   
   Reusable variants. These are the ONLY patterns used.
   ──────────────────────────────────────────────────────────────── */

import type { Variants } from 'framer-motion';

/** Build a transition object. Every component should use this
 *  instead of writing inline transition objects. */
export function createTransition(
  durationKey: DurationKey = 'normal',
  easingKey: EasingKey = 'easeOutExpo',
  delay: number = 0
) {
  return {
    duration: durations[durationKey],
    ease: easings[easingKey].array,
    delay,
  };
}

/** Fade up — element fades in and translates upward */
export function fadeUp(
  durationKey: DurationKey = 'normal',
  easingKey: EasingKey = 'easeOutExpo',
  distance: number = 24
): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: durations[durationKey], ease: easings[easingKey].array },
    },
  };
}

/** Fade in — pure opacity, no transform */
export function fadeIn(
  durationKey: DurationKey = 'normal',
  easingKey: EasingKey = 'easeOut'
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: durations[durationKey], ease: easings[easingKey].array },
    },
  };
}

/** Scale in — element scales from slightly smaller */
export function scaleIn(
  durationKey: DurationKey = 'slow',
  easingKey: EasingKey = 'easeOutCinematic',
  fromScale: number = 0.92
): Variants {
  return {
    hidden: { opacity: 0, scale: fromScale },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: durations[durationKey], ease: easings[easingKey].array },
    },
  };
}

/** Slide from direction */
export function slideFrom(
  direction: 'left' | 'right',
  durationKey: DurationKey = 'slow',
  easingKey: EasingKey = 'easeOutExpo',
  distance: number = 40
): Variants {
  const x = direction === 'left' ? -distance : distance;
  return {
    hidden: { opacity: 0, x },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: durations[durationKey], ease: easings[easingKey].array },
    },
  };
}

/** Clip-path reveal — for photographic entries */
export function clipReveal(durationKey: DurationKey = 'cinema', easingKey: EasingKey = 'easeOutCinematic'): Variants {
  return {
    hidden: { clipPath: 'inset(0 100% 0 0)' },
    visible: {
      clipPath: 'inset(0 0 0 0)',
      transition: { duration: durations[durationKey], ease: easings[easingKey].array },
    },
  };
}

/** Stagger container — for lists and grids */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggers.normal,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOutExpo.array },
  },
};

/* ────────────────────────────────────────────────────────────────
   7. LOADING ANIMATIONS
   
   The branded loading experience. Never use a spinner.
   ──────────────────────────────────────────────────────────────── */

export const loadingAnimations = {
  /** Logo mark rotates gently + fades in */
  logoMark: {
    initial: { opacity: 0, scale: 0.8, rotate: -10 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: durations.slow, ease: easings.easeOutExpo.array },
  },

  /** The wordmark letters appear sequentially */
  wordmarkStagger: {
    container: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { staggerChildren: staggers.fast },
    },
    child: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: durations.fast, ease: easings.easeOut.array },
    },
  },

  /** Content appears after loading completes */
  contentReveal: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.normal, ease: easings.easeOutExpo.array },
  },
} as const;

/* ────────────────────────────────────────────────────────────────
   8. CURSOR INTERACTIONS
   
   Premium custom cursor behaviors.
   ──────────────────────────────────────────────────────────────── */

export const cursorBehaviors = {
  /** Default cursor state */
  default: {
    size: 8,
    border: '1px solid rgba(17, 24, 39, 0.3)',
    background: 'transparent',
    blendMode: 'normal' as const,
  },

  /** Hovering over a link or button */
  hover: {
    size: 32,
    border: '1px solid rgba(34, 197, 94, 0.5)',
    background: 'rgba(34, 197, 94, 0.08)',
    blendMode: 'normal' as const,
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  /** Hovering over an image */
  imageHover: {
    size: 48,
    border: '1px solid rgba(255, 255, 255, 0.5)',
    background: 'rgba(255, 255, 255, 0.1)',
    blendMode: 'difference' as const,
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  /** Click state */
  click: {
    size: 16,
    scale: 0.8,
    transition: { duration: 0.15, ease: 'easeOut' },
  },

  /** Hidden on touch devices */
  touchDevice: {
    display: 'none',
  },
} as const;

/* ────────────────────────────────────────────────────────────────
   9. PARALLAX SCALE
   
   Subtle depth layers. Never exaggerated.
   ──────────────────────────────────────────────────────────────── */

export const parallaxIntensity = {
  deep: { speed: 0.15 },
  mid: { speed: 0.3 },
  foreground: { speed: 0.5 },
} as const;

/* ────────────────────────────────────────────────────────────────
   10. ACCESSIBILITY
   
   Respects prefers-reduced-motion at every level.
   ──────────────────────────────────────────────────────────────── */

import type { Transition } from 'framer-motion';

export function getReducedTransition(): Transition {
  return { duration: 0.01, ease: 'linear' };
}

export const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

/* ────────────────────────────────────────────────────────────────
   11. PERFORMANCE BUDGET
   
   • Target: 60fps at all times
   • Use transform and opacity only (GPU-composited properties)
   • Never animate layout properties (width, height, top, left)
   • will-change on elements that animate continuously
   • Limit concurrent animations to 12 simultaneous
   • Scroll-triggered animations use once:true for recycled views
   ──────────────────────────────────────────────────────────────── */
