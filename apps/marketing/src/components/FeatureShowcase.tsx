import {
  Banknote,
  CreditCard,
  Layers,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import { Item, ItemDescription, ItemIcon, ItemTitle } from './ui/item';
import { Section } from './ui/section';

const features = [
  {
    icon: ShoppingBag,
    title: 'Bottom-sheet quick-add',
    description: 'Add to cart without ever leaving the product list.',
  },
  {
    icon: MapPin,
    title: 'Live map tracking',
    description: 'Real-time GPS, pushed to you — no polling, no battery drain.',
  },
  {
    icon: Layers,
    title: 'One cart, every vendor',
    description: 'Order across storefronts, checkout once.',
  },
  {
    icon: Banknote,
    title: 'Cash on Delivery',
    description: 'COD available up to ₹2,000 per order.',
  },
  {
    icon: CreditCard,
    title: 'Razorpay-secured checkout',
    description: 'Bank-grade payment security on every order.',
  },
  {
    icon: ShieldCheck,
    title: 'KYC-verified vendors',
    description: 'Every seller on the platform is identity- and quality-checked.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Zone-gated launch',
    description: 'Live in Hyderabad and Vijayawada, expanding deliberately.',
  },
  {
    icon: Sparkles,
    title: 'Three storefronts, one app',
    description: 'Swap between Organic, Natural, and Eco-Friendly in a tap.',
  },
];

export default function FeatureShowcase() {
  return (
    <Section className="bg-secondary/40">
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-16">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything in one app
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-md mx-auto">
            Built for how people actually shop for groceries.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-background rounded-xl border border-border p-2 transition-all duration-250 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40"
            >
              <Item>
                <ItemIcon className="transition-all duration-250 group-hover:bg-primary group-hover:border-primary">
                  <feature.icon className="w-5 h-5 transition-colors duration-250 group-hover:text-primary-foreground" strokeWidth={1.5} />
                </ItemIcon>
                <ItemTitle>{feature.title}</ItemTitle>
                <ItemDescription>{feature.description}</ItemDescription>
              </Item>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
