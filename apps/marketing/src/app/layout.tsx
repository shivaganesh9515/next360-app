import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Next360 — Organic, Natural & Eco-Friendly Grocery Delivery',
  description:
    'Multi-vendor marketplace for organic, natural, and eco-friendly groceries. Live in Hyderabad and Vijayawada. Order from verified local vendors with live delivery tracking.',
  keywords: [
    'organic grocery delivery',
    'natural products',
    'eco-friendly marketplace',
    'Hyderabad grocery',
    'Vijayawada grocery',
    'multi-vendor organic',
  ],
  openGraph: {
    title: 'Next360 — Organic, Natural & Eco-Friendly Grocery Delivery',
    description:
      'Multi-vendor marketplace for organic, natural, and eco-friendly groceries. Live in Hyderabad and Vijayawada.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
