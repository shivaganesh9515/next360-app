import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const glowVariants = cva('absolute w-full pointer-events-none', {
  variants: {
    variant: {
      top: 'top-0',
      above: '-top-[128px]',
      bottom: 'bottom-0',
      below: '-bottom-[128px]',
      center: 'top-[50%]',
    },
  },
  defaultVariants: {
    variant: 'top',
  },
});

/* A soft brass radial glow, two layers (wide+dim, tight+richer) — tuned
   down from launch-ui's dark-background intensity (which would read as a
   smudge on Next360's fixed white bg) but strong enough to actually read
   as ambient light rather than disappearing entirely. */
function Glow({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof glowVariants>) {
  return (
    <div data-slot="glow" className={cn(glowVariants({ variant }), className)} {...props}>
      <div
        className={cn(
          'from-brand/30 to-brand/0 absolute left-1/2 h-[280px] w-[70%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-radial from-10% to-60% opacity-60 sm:h-[560px]',
          variant === 'center' && '-translate-y-1/2',
        )}
      />
      <div
        className={cn(
          'from-brand/40 to-brand/0 absolute left-1/2 h-[140px] w-[35%] -translate-x-1/2 scale-150 rounded-[50%] bg-radial from-10% to-60% opacity-70 sm:h-[280px]',
          variant === 'center' && '-translate-y-1/2',
        )}
      />
    </div>
  );
}

export default Glow;
