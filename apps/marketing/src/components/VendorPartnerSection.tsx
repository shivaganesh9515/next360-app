'use client';

import { useRef } from 'react';
import { Store, Truck } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Button } from './ui/button';
import { Section } from './ui/section';

export default function VendorPartnerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollReveal(sectionRef, { threshold: 0.2 });
  const prefersReduced = usePrefersReducedMotion();

  const fade = (delay: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: prefersReduced
      ? 'opacity 0.2s ease'
      : `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  });

  return (
    <Section id="vendors" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="max-w-container mx-auto">
        <div className="relative rounded-2xl border border-border bg-secondary/40 px-6 sm:px-12 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight" style={fade(0)}>
              Grow with Next360
            </h2>

            <p className="mt-4 text-muted-foreground text-lg leading-relaxed" style={fade(100)}>
              List your organic or eco products, reach two cities from day one.
            </p>

            <div
              id="delivery"
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
              style={fade(200)}
            >
              <Button variant="outline" size="lg" asChild>
                <a href="#">
                  <Store className="w-4 h-4" />
                  Register as a Vendor
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#">
                  <Truck className="w-4 h-4" />
                  Become a Delivery Partner
                </a>
              </Button>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-border rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-border rounded-br-2xl" />
        </div>
      </div>
    </Section>
  );
}
