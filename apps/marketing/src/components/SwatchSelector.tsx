'use client';

import { useState } from 'react';
import { SWATCHES } from '@/lib/constants';
import type { Swatch } from '@/lib/constants';

interface SwatchSelectorProps {
  onSwatchChange?: (swatch: Swatch) => void;
}

export default function SwatchSelector({ onSwatchChange }: SwatchSelectorProps) {
  const [active, setActive] = useState<Swatch['id']>('ORGANIC');

  const handleSelect = (swatch: Swatch) => {
    setActive(swatch.id);
    onSwatchChange?.(swatch);
  };

  const activeSwatch = SWATCHES.find((s) => s.id === active)!;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Swatch row */}
      <div className="flex items-center gap-3">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.id}
            onClick={() => handleSelect(swatch)}
            className={`
              group relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden
              border-2 transition-all duration-250 ease-out
              focus-ring cursor-pointer
              ${swatch.texture}
              ${active === swatch.id
                ? 'scale-105'
                : 'opacity-70 hover:opacity-100 hover:scale-102'
              }
            `}
            style={{
              borderColor: active === swatch.id ? swatch.accent : swatch.border,
              boxShadow: active === swatch.id ? `0 0 0 2px white, 0 0 0 4px ${swatch.accent}` : 'none',
            }}
            aria-label={`Select ${swatch.label} storefront`}
            aria-pressed={active === swatch.id}
          >
            {/* Active indicator dot */}
            {active === swatch.id && (
              <div
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: swatch.accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center gap-2">
        <span
          className="font-display text-sm font-medium transition-colors duration-250"
          style={{ color: activeSwatch.accent }}
        >
          {activeSwatch.label}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">Storefront</span>
      </div>
    </div>
  );
}
