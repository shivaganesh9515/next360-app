import * as React from 'react';

import { cn } from '@/lib/utils';

/* Fixed full-page dot-grid texture + vertical content-column guide lines —
   the actual visible-grid treatment (not just a near-invisible hairline)
   that reads as deliberate structure rather than plain flat white. */
function LayoutLines({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section className={cn('pointer-events-none fixed inset-0 top-0 z-0', className)} {...props}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.5,
        }}
      />
      <div className="max-w-container line-y line-dashed mx-auto flex h-full flex-col border-border" />
    </section>
  );
}

export { LayoutLines };
