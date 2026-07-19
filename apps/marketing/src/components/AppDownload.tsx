import { Apple, Play, Check } from 'lucide-react';

import AppScreenPreview from './AppScreenPreview';
import Glow from './ui/glow';
import { Mockup, MockupFrame } from './ui/mockup';
import { Section } from './ui/section';

const valueProps = [
  'Bottom-sheet quick-add, no page reloads',
  'Live map tracking, no polling',
  'One cart across all your vendors',
];

export default function AppDownload() {
  return (
    <Section id="download">
      <div className="max-w-container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — Phone mockup */}
        <div className="relative flex justify-center">
          <div className="relative w-[280px] sm:w-[300px]">
            <MockupFrame>
              <Mockup type="mobile" className="bg-background w-full">
                <AppScreenPreview />
              </Mockup>
            </MockupFrame>
            <Glow variant="center" className="opacity-0 animate-appear-zoom" />
          </div>
        </div>

        {/* Right — Download info */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Your organic pantry, always within reach
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              One app. Three storefronts. Verified vendors across two cities.
            </p>
          </div>

          {/* QR code placeholder */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-border rounded-lg flex items-center justify-center bg-secondary">
              <span className="font-mono text-[10px] text-muted-foreground text-center leading-tight">
                QR<br />Code
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Scan to download</p>
              <p className="text-xs text-muted-foreground mt-0.5">Available on iOS &amp; Android</p>
            </div>
          </div>

          {/* App Store badges */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Apple className="w-5 h-5" />
              <div className="text-left">
                <span className="block text-[10px] opacity-70 leading-none">Download on the</span>
                <span className="block text-sm font-semibold leading-tight">App Store</span>
              </div>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5" />
              <div className="text-left">
                <span className="block text-[10px] opacity-70 leading-none">Get it on</span>
                <span className="block text-sm font-semibold leading-tight">Google Play</span>
              </div>
            </a>
          </div>

          {/* Value props */}
          <ul className="space-y-3">
            {valueProps.map((prop) => (
              <li key={prop} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">{prop}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
