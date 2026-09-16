# NEXT360 — Motion Language

> **A design system for motion.**
>
> Every animation on next360.com follows this document. Nothing is invented ad-hoc.
> This is a design reference — not code. Implementation tokens live in `src/lib/motion.ts`.

---

## Contents

1. [Animation Philosophy](#1-animation-philosophy)
2. [Easing System](#2-easing-system)
3. [Timing Scale](#3-timing-scale)
4. [Stagger Scale](#4-stagger-scale)
5. [Scroll Choreography](#5-scroll-choreography)
6. [Hover Behaviors](#6-hover-behaviors)
7. [Page Transition Rules](#7-page-transition-rules)
8. [Loading Animations](#8-loading-animations)
9. [Cursor Interactions](#9-cursor-interactions)
10. [Depth & Parallax System](#10-depth--parallax-system)
11. [Motion Accessibility](#11-motion-accessibility)
12. [Performance Budget](#12-performance-budget)

---

## 1. Animation Philosophy

### Principles

Motion is never decorative. Every animation on next360.com serves one of these purposes:

- **Guide attention** — direct the eye to what matters
- **Create anticipation** — prepare the user for what comes next
- **Communicate hierarchy** — show what's primary, secondary, tertiary
- **Reveal information** — present content at the right moment
- **Provide feedback** — confirm user actions
- **Establish depth** — create a sense of physical space
- **Tell a story** — make the journey feel intentional

### Rules

| Rule | Explanation |
|------|-------------|
| **No bounce** | Bounce animations feel playful. Next360 is premium, not playful. |
| **No elastic** | Elastic overshoot feels unstable. Every motion settles cleanly. |
| **No overshoot** | Elements land precisely where they need to be. No over-correction. |
| **No cartoon motion** | No wobble, wiggle, shake, or jiggle. No confetti. No particle bursts. |
| **No constant floating** | Elements should rest when they're not being interacted with. |
| **No fast popups** | Nothing appears instantly. Everything has a deliberate entrance. |
| **No random rotations** | Every rotation has a functional reason (e.g., a loading indicator). |
| **No over-scaling** | Scale changes stay between 0.92 and 1.15. Never larger. |

### Feeling

The motion should feel:

```
Organic    ·    Natural    ·    Confident
Elegant    ·    Intentional ·    Cinematic
Smooth     ·    Premium     ·    Invisible
```

The user should notice **how the website feels**, not how it animates.
If an animation draws attention to itself, it fails.

### References

| Brand | What to learn from them |
|-------|------------------------|
| **Apple** | Restraint. Nothing moves unless it must. |
| **Linear** | Precision. Micro-interactions at 150ms. |
| **Stripe** | Fluidity. Payment flows that feel seamless. |
| **Arc Browser** | Intent. Every animation has a clear purpose. |
| **Aesop** | Natural. Organic easing, no digital feel. |
| **Nothing** | Minimalism. The absence of motion is a choice. |

---

## 2. Easing System

Five easing curves. Every animation uses one of these. Nothing else.

| Name | Curve | When to use |
|------|-------|-------------|
| **easeOutExpo** | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary ease. All entrance animations, scroll reveals, section entries. Fast start with smooth deceleration to rest. |
| **easeOut** | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Standard ease-out. Micro-interactions, button hovers, quick transitions. |
| **easeInOut** | `cubic-bezier(0.65, 0, 0.35, 1)` | Bidirectional state changes. Menu open/close, overlay transitions. |
| **easeIn** | `cubic-bezier(0.55, 0.055, 0.675, 0.19)` | Exit animations only. Elements leaving the screen. Use sparingly. |
| **easeOutCinematic** | `cubic-bezier(0.06, 0.7, 0.1, 1)` | Ultra-smooth deceleration. Photography reveals, hero background, large-scale entries. |

### Curve shapes

```
easeOutExpo:      ▁▂▄▆▇██  ← Fast start, smooth settle. Most common.
easeOut:          ▁▂▃▄▅▆▇   ← Gentle ease-out. Micro-interactions.
easeInOut:        ▃▅▇▇▅▃    ← Symmetrical. Bidirectional transitions.
easeIn:           ▇▆▅▄▃▂▁   ← Slow start. Only for exits.
easeOutCinematic: ▁▁▂▃▅▇██  ← Very slow start, long tail. Cinematic moments.
```

### What not to use

```
❌ bounce    ❌ elastic    ❌ back      ❌ circ
❌ linear    ❌ steps      ❌ spring    ❌ CustomEase with overshoot
```

---

## 3. Timing Scale

Five duration buckets. Every animation maps to exactly one.

| Bucket | Value | When to use |
|--------|-------|-------------|
| **micro** | 150ms | Instant feedback. Button hover state transitions, border color changes. |
| **fast** | 300ms | Quick interactions. Link hovers, card hover effects, search bar focus. |
| **normal** | 500ms | Standard reveals. Section content entries, feature grid items, text appearances. |
| **slow** | 800ms | Substantial reveals. Hero sub-content, photography captions, store entries. |
| **cinema** | 1400ms | Cinematic moments. Hero headline, full-bleed photography reveals, loading logo. |

### Timing guidelines

- **Micro and fast** are for hover/active states. The user should feel immediate responsiveness.
- **Normal** is the default for scroll-triggered entries. Most content uses this.
- **Slow** is for hero elements and photography. Use deliberately — not everything should be slow.
- **Cinema** is for the first impression only. Hero background and logo. Nothing else should take this long.

### Timing by section

| Section | Entry duration | Detail duration |
|---------|---------------|-----------------|
| Hero | cinema (1400ms) | slow (800ms) |
| Photography spreads | cinema (1400ms) | slow (800ms) |
| Store entries | slow (800ms) | normal (500ms) |
| Grid items | normal (500ms) | normal (500ms) |
| Micro-interactions | — | fast (300ms) |
| Hover states | — | micro (150ms) |

---

## 4. Stagger Scale

Four stagger intervals. Every sequenced animation uses one of these.

| Tier | Value | When to use |
|------|-------|-------------|
| **fast** | 40ms | Rapid stagger. Grid items, feature cards, closely related elements. |
| **normal** | 80ms | Standard stagger. Store list items, step sequences. |
| **slow** | 150ms | Deliberate stagger. Hero text lines, section reveals. |
| **spread** | 300ms | Wide stagger. Multi-section reveals, large separations. |

### Stagger direction

- **Vertical lists**: stagger from top to bottom
- **Horizontal rows**: stagger from left to right
- **Grids**: stagger from top-left to bottom-right
- **Hero lines**: stagger from top to bottom (first line first)
- **Two-column layouts**: stagger by column, then by row within each column

---

## 5. Scroll Choreography

Every section on the page has a unique entrance animation.
No two consecutive sections share the same pattern.

### Section animation map

| Section | Animation | Tool | Description |
|---------|-----------|------|-------------|
| **Hero** | Cinematic timeline | GSAP | 5-phase sequence: photo blur→scale → headline lines stagger → live indicator → search scale → CTA |
| **Editorial Statement** | Fade-up + divider | Framer Motion | Centered pull-quote rises with `easeOutCinematic`. Hairline divider scales from center. |
| **Photography Spread** | Clip-path wipe + scale | Framer Motion | Image reveals via vertical clip-path wipe from left, simultaneously scales down from 1.15. Caption fades up after. |
| **Store Discovery** | Stagger + slide from direction | Framer Motion | Container staggers children. Each store row slides from alternating sides (left, right, left). |
| **How It Works** | Staggered timeline | Framer Motion | Steps alternate from opposite sides. Item 1 from left, item 2 from right, item 3 from left. |
| **Feature Showcase** | Rapid grid fade-up | Framer Motion | 2-column grid. Items fade up with 40ms stagger. Fast and efficient. |
| **Photography Interlude** | Scale reveal | Framer Motion | Image scales from 1.15 to 1 with opacity. Different from the clip-path reveal above. Caption slides from right. |
| **App Download** | Opposing slides | Framer Motion | Phone mockup slides from left. Text content slides from right. Meet in the center. |
| **Vendor CTA** | Centered fade-up | Framer Motion | Headline rises first, then subtitle, then buttons. All centered. |

### Animation uniqueness rules

1. No two consecutive sections use the same animation
2. No section uses a simple opacity-only reveal (no `fadeIn`)
3. Every photography reveal is different (clip-path ≠ scale ≠ slide)
4. Text always enters after its accompanying image
5. The hero is the only section driven by GSAP

### Mobile adaptations

On viewports narrower than 768px, animations that rely on horizontal direction simplify:

| Desktop animation | Mobile equivalent |
|------------------|-------------------|
| Slide from left/right | Fade-up (translateY 20px) |
| Staggered alternating sides | Simple top-to-bottom stagger |
| Opposing slides (left + right) | Both elements fade-up |
| Staggered timeline with direction | Top-to-bottom fade-up |

Mobile entries use the same easing and duration — only the directionality changes.

### Scroll trigger settings

- Every section uses `useInView` with `once: true` (Framer Motion) or equivalent (GSAP)
- All triggers have a viewport margin of `-10%` to start the animation slightly before the section enters view
- Nothing re-triggers on scroll-back — motion is a one-time reveal

---

## 6. Hover Behaviors

Every interactive element maps to one of these patterns.

| Element | Behavior | Duration | Easing |
|---------|----------|----------|--------|
| **Text link** | Color transition only. No transform. | 150ms | easeOut |
| **Primary button** | Scale up 1.02 on hover, scale down 0.98 on click. Shadow deepens on hover. | 300ms | easeOut |
| **Outline button** | Border color transition. Background fill on hover. | 300ms | easeOut |
| **Card / tile** | Translate up -4px on hover. Shadow elevation increases. | 300ms | easeOut |
| **Image** | Scale up 1.03 on hover. Brightness increases subtly. | 500ms | easeOut |
| **Magnetic CTA** | CTA follows cursor with a subtle pull (spring-like), returns smoothly when cursor leaves. | 300ms | easeOut |

### Additional: magnetic CTA behavior

The hero CTA has a magnetic effect:

1. As the cursor approaches, the link subtly shifts toward the cursor position
2. The shift is barely perceptible — about 20% of the cursor-to-center distance
3. When the cursor leaves, the link returns to its original position with a smooth ease-out
4. This effect only applies to the primary hero CTA — not to other links or buttons

### What not to do

```
❌ Color inversion on hover
❌ Text shadow shifts
❌ Background sliding animations
❌ Icon rotations on hover
❌ Underline animations from left
❌ Border dancing / gradient sweeps
```

---

## 7. Page Transition Rules

> Currently a single-page application. These rules apply when multi-page navigation is introduced.

### Transition types

| Type | When to use | Duration | Easing |
|------|-------------|----------|--------|
| **Content morph** | Navigating between sections with shared elements | 500ms | easeInOut |
| **Fade through** | Standard page-to-page navigation | 400ms | easeOut |
| **Directional** | Navigating forward/backward (e.g., product detail) | 500ms | easeOutExpo |

### Rules

- Never use the default browser navigation
- Always animate the content area, not the chrome (nav, footer)
- The navigation bar should remain visible and stable during transitions
- Images should persist (crossfade) when the new page contains a similar image
- Loading states during transitions use the branded loading animation (see §8)

---

## 8. Loading Animations

Never show a spinning loader. The loading experience is branded and intentional.

### Phase sequence

| Phase | Animation | Duration | Description |
|-------|-----------|----------|-------------|
| **Logo mark** | Scale from 0.8 + rotate from -10° | 800ms (cinema) | The N logo mark appears first, growing into place with a gentle rotation. |
| **Wordmark** | Letters fade up sequentially | 40ms per letter | "Next360" letters appear one after another beneath the mark. |
| **Content reveal** | Content fades up | 500ms (normal) | Once loading completes, the page content rises into view. |

**Total sequence:** 800ms + ~8 letters × 40ms + 500ms ≈ 1.6s

### Loading screen rules

- No spinning, no pulsing dots, no progress bars
- Background: white (#FFFFFF)
- Logo: charcoal (#111827) on white
- If content loads in under 1.5s, complete at least the logo mark animation (800ms) before revealing content
- If content takes more than 2s, transition the logo into a gentle `breathe` animation (scale 1 ↔ 1.02 over 4s) until ready
- Never cut the logo animation short — always show at least the first 800ms

---

## 9. Cursor Interactions

A premium custom cursor that adapts to context.

### Cursor states

| State | Size | Border | Background | Blend mode |
|-------|------|--------|------------|------------|
| **Default** | 8px | `1px solid rgba(17,24,39,0.3)` | Transparent | Normal |
| **Hover (link/button)** | 32px | `1px solid rgba(34,197,94,0.5)` | `rgba(34,197,94,0.08)` | Normal |
| **Hover (image)** | 48px | `1px solid rgba(255,255,255,0.5)` | `rgba(255,255,255,0.1)` | Difference |
| **Click** | 24px | `1px solid rgba(34,197,94,0.6)` | `rgba(34,197,94,0.15)` | Normal |

During a click, the cursor contracts to 24px over 150ms (from whichever hover state preceded it — 32px for links or 48px for images), then returns to the active hover size. This creates a subtle "press" response without any scaling distortion.

### Behavior rules

- Hidden on touch devices (phones, tablets)
- Follows the mouse with a 50ms delay for smoothness
- Transitions between states use 300ms easeOut
- Never obscures text — shrinks when over dense content areas
- Images use `mix-blend-mode: difference` so the cursor inverts against any background, remaining visible on both light and dark surfaces

---

## 10. Depth & Parallax System

Subtle parallax creates a sense of physical depth. Never exaggerated.

### Depth layers

| Layer | Speed | Elements |
|-------|-------|----------|
| **Deep (background)** | 0.15x | Hero background image, photography spread backgrounds |
| **Mid (content)** | 0.3x | Foreground content, text overlays, store cards |
| **Foreground (UI)** | 0.5x | Search bar, CTA buttons, navigation |

### Parallax rules

- Only apply to photography sections (Hero, PhotographySpread, PhotographyInterlude)
- Never apply to text that needs to remain readable
- Movement should be barely perceptible — the user should feel depth, not see it
- Maximum offset: 30px on deep layer, 10px on foreground
- Responsive: disable parallax on mobile (below 768px)

### What not to do

```
❌ Mouse-driven parallax (tilting on cursor move)
❌ Multi-layer parallax with more than 3 layers
❌ Parallax on every section — use selectively
❌ Parallax that causes elements to clip or overflow
```

---

## 11. Motion Accessibility

### prefers-reduced-motion

All motion respects the user's system preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### By library

| Library | Reduced motion behavior |
|---------|------------------------|
| **CSS** | Blanket media query above covers all CSS transitions and animations |
| **Framer Motion** | `useInView` with `once: true` still fires — elements appear instantly, no animation |
| **GSAP** | `gsap.context()` auto-reverts on unmount. Tweens complete in 0.01ms. |
| **Lenis** | Smooth scrolling disabled. Falls back to native browser scroll. |

### Animations that should still work

- Scroll-triggered reveals (content still appears, just without animation)
- Hover states (state changes happen instantly, no transition)
- Search feedback (text appears immediately)
- Live indicator (the dot should still pulse — this provides functional feedback, not decoration)

---

## 12. Performance Budget

### Target

**60 frames per second. Every device. Every browser.**

### Rules

| Rule | Rationale |
|------|-----------|
| **Animate only `transform` and `opacity`** | These are GPU-composited. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`. |
| **Use `will-change` sparingly** | Only on elements that animate continuously (live dot, loading logo). Remove after animation completes. |
| **Max 12 concurrent animations** | Browsers struggle beyond this. Stagger sequences to reduce concurrency. |
| **`once: true` on all scroll triggers** | Animations fire once and stop. No re-triggering on scroll-back. |
| **No layout thrashing** | Read DOM properties once, write once. Batch reads before writes. |
| **Image optimization** | All photography uses Next.js `<Image>` with `sizes` prop. No raw `<img>` tags. |

### Animation property checklist

If you're animating a property not on this list, stop and reconsider:

```
✅ transform: translate, scale, rotate
✅ opacity
✅ clip-path (GPU-accelerated in modern browsers)
✅ filter (use sparingly — expensive on some devices)
✅ background-color (use only for hover micro-interactions)

❌ width / height / min-width / max-width
❌ top / left / right / bottom
❌ margin / padding
❌ border-width / border-radius
❌ box-shadow (use filter: drop-shadow() instead)
❌ background-position
```

### Device targets

| Device | Expectations |
|--------|-------------|
| Desktop (modern) | 60fps, all effects |
| Laptop (integrated GPU) | 60fps, all effects |
| Tablet | 60fps, reduced parallax |
| Mobile | 60fps, no parallax, single-direction entries |
| Low-power mode | Reduced motion is respected |

---

## Appendix: Implementation tokens

The motion language is implemented in code at `src/lib/motion.ts`. This file exports:

- `easings` — all five curves in `array` (Framer Motion) and `gsap` (string) formats
- `durations` — all five timing buckets in seconds
- `staggers` — all four stagger tiers in seconds
- `scrollEntries` — the section animation map
- `hoverBehaviors` — all hover patterns
- `loadingAnimations` — branded loading sequence
- `cursorBehaviors` — custom cursor states
- `parallaxIntensity` — depth layer speeds
- `getReducedTransition()` / `reducedVariants` — accessibility utilities
- `fadeUp()`, `fadeIn()`, `scaleIn()`, `slideFrom()`, `clipReveal()` — reusable Framer Motion variants
- `staggerContainer`, `staggerItem` — list animation variants

Every component imports from this file. No component defines its own motion values.

---

*Last updated: July 2026*
*Design system version: 1.0*
