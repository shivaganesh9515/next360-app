'use client';

import { useRef } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Banknote,
  MapPin,
  Map,
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const trustItems = [
  { icon: BadgeCheck, label: 'KYC-Verified Vendors' },
  { icon: CreditCard, label: 'Razorpay-Secured Payments' },
  { icon: Banknote, label: 'Cash on Delivery Available' },
  { icon: MapPin, label: 'Live Delivery Tracking' },
  { icon: Map, label: 'Hyderabad + Vijayawada Live' },
];

function TrustItem({
  item,
  index,
}: {
  item: (typeof trustItems)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useScrollReveal(ref, { threshold: 0.3 });
  const prefersReduced = usePrefersReducedMotion();
  const staggerDelay = prefersReduced ? 0 : index * 80;

  return (
    <div
      ref={ref}
      className="flex items-center gap-2.5 text-gray-400"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: prefersReduced
          ? 'opacity 0.2s ease'
          : `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms`,
      }}
    >
      <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      <span className="font-mono text-[11px] tracking-wide uppercase whitespace-nowrap">
        {item.label}
      </span>
    </div>
  );
}

export default function TrustStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useScrollReveal(sectionRef, { threshold: 0.1 });

  return (
    <section
      id="trust"
      ref={sectionRef}
      className="bg-background line-y border-border"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustItems.map((item, i) => (
            <TrustItem key={item.label} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
