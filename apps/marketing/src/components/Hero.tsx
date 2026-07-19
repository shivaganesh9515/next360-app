'use client';

import { useState } from 'react';
import { Apple, ChevronDown, Play } from 'lucide-react';

import SwatchSelector from './SwatchSelector';
import { Badge } from './ui/badge';
import { LinkButton } from './ui/link-button';
import { DEFAULT_SWATCH } from '@/lib/constants';
import type { Swatch } from '@/lib/constants';

/* Full-viewport, full-bleed hero — deliberately immersive (Zomato's
   defining structural trait) rather than the contained/editorial layout
   this had before. Background is a deep wash of the active swatch's own
   accent color, not a photo (we have none), with white text for contrast —
   borrows Zomato's "color/type fills the whole screen" energy while
   staying inside Next360's own palette instead of adopting Zomato's red. */
export default function Hero() {
  const [activeSwatch, setActiveSwatch] = useState<Swatch>(DEFAULT_SWATCH);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 transition-colors duration-500"
      style={{
        background: `linear-gradient(160deg, ${activeSwatch.accent} 0%, color-mix(in srgb, ${activeSwatch.accent} 70%, black) 100%)`,
      }}
    >
      {/* Subtle white dot-grid texture over the color field, for depth */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(white 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-container mx-auto flex flex-col items-center gap-7 text-center py-24">
        <Badge variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm">
          <span className="text-white/90">Live in Hyderabad &amp; Vijayawada</span>
        </Badge>

        {/* Headline — huge, white, filling the screen the way Zomato's does */}
        <h1 className="font-display text-5xl leading-[1.05] font-bold text-white text-balance sm:text-7xl md:text-8xl">
          <span className="whitespace-nowrap">Organic. Natural.</span>
          <br />
          <span className="whitespace-nowrap text-white/95">Eco-friendly.</span>
          <br />
          All in one delivery.
        </h1>

        <p className="text-white/80 relative z-10 max-w-[640px] text-lg font-medium text-balance sm:text-2xl">
          Three curated storefronts — verified local vendors, live tracking, one app.
        </p>

        {/* Floating white card for the swatch selector — its internals are
            built for a light background, so it gets its own light surface
            rather than being redesigned for every hero background color. */}
        <div className="bg-background/95 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-2xl mt-2">
          <SwatchSelector onSwatchChange={setActiveSwatch} />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4 mt-2">
          <LinkButton href="#download" variant="default" size="lg" className="bg-white text-foreground hover:bg-white/90">
            <span className="flex items-center gap-3">
              Get the App
              <span className="flex items-center gap-1.5 border-l border-foreground/20 pl-3">
                <Apple className="w-4 h-4" />
                <Play className="w-3.5 h-3.5" />
              </span>
            </span>
          </LinkButton>
          <LinkButton
            href="#trust"
            variant="outline"
            size="lg"
            className="border-white/40 bg-transparent text-white hover:bg-white/10"
          >
            Check if we deliver to you
          </LinkButton>
        </div>

        <a
          href="#mission"
          className="mt-8 flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors focus-ring rounded-sm"
        >
          <span className="font-mono text-[11px] tracking-widest uppercase">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
