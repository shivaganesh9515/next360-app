import { Sprout } from 'lucide-react';

import { Badge } from './ui/badge';
import Glow from './ui/glow';

const TIERS = ['Seed', 'Seedling', 'Sapling', 'Plant', 'Young Tree', 'Tree', 'Mature Tree', 'Forest'];

/* Dark, high-contrast band — the Next360 equivalent of Zomato's "Gold"
   section. Explicitly marked Coming Soon: the loyalty program (Phase 12
   in the roadmap) hasn't shipped yet, so this previews the plan without
   claiming it's a live feature. */
export default function LoyaltyTeaser() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 sm:py-28 px-4">
      <Glow variant="bottom" />
      <div className="max-w-container mx-auto text-center relative z-10">
        <Badge variant="outline" className="border-gray-700 mb-6">
          <span className="text-gray-400">Coming soon</span>
        </Badge>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
          Grow with every order
        </h2>
        <p className="mt-4 text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
          Earn points on every delivery and watch your loyalty tier grow — from a single
          seed all the way to a forest.
        </p>

        {/* Tier progression strip — icon size ramps up across 8 stages */}
        <div className="mt-16 overflow-x-auto">
          <div className="flex items-end justify-center gap-3 sm:gap-6 min-w-max px-4 mx-auto">
            {TIERS.map((tier, i) => {
              const size = 16 + i * 3;
              const opacity = 0.35 + (i / (TIERS.length - 1)) * 0.65;
              return (
                <div key={tier} className="flex flex-col items-center gap-2 w-16">
                  <div
                    className="flex items-center justify-center rounded-full bg-gray-800 border border-gray-700"
                    style={{ width: size + 24, height: size + 24 }}
                  >
                    <Sprout
                      style={{ width: size, height: size, opacity }}
                      className="text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="font-mono text-[9px] sm:text-[10px] text-gray-500 tracking-wide text-center leading-tight">
                    {tier}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-12 font-mono text-[11px] text-gray-600 tracking-wide uppercase">
          5 points per ₹100 · Awarded on delivery
        </p>
      </div>
    </section>
  );
}
