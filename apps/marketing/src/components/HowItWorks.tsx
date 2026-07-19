import { ShoppingBag, Store, Truck } from 'lucide-react';

import { Item, ItemDescription, ItemIcon, ItemTitle } from './ui/item';
import { Section } from './ui/section';

const steps = [
  {
    icon: Store,
    label: 'Pick your storefront',
    description: 'Choose from Organic, Natural, or Eco-Friendly.',
  },
  {
    icon: ShoppingBag,
    label: 'Order from verified local vendors',
    description: 'Every vendor is KYC-verified and quality-checked.',
  },
  {
    icon: Truck,
    label: 'Track live to your door',
    description: 'Real-time GPS tracking, no polling — instant updates.',
  },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-16">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">Three steps from craving to doorstep.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {steps.map((step, i) => (
            <Item key={step.label} className="items-center text-center">
              <ItemIcon>
                <step.icon className="w-5 h-5" strokeWidth={1.5} />
              </ItemIcon>
              <span className="font-mono text-[11px] text-muted-foreground tracking-widest uppercase">
                Step {i + 1}
              </span>
              <ItemTitle>{step.label}</ItemTitle>
              <ItemDescription className="mx-auto">{step.description}</ItemDescription>
            </Item>
          ))}
        </div>
      </div>
    </Section>
  );
}
