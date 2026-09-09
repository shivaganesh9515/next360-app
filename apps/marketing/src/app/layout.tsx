import type { Metadata, Viewport } from 'next';
import { Fraunces, Playfair_Display, Manrope } from 'next/font/google';
import LenisProvider from '@/components/lenis-provider';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display-alt',
  display: 'swap',
  weight: ['400', '600'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#16241C',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://next360.in'),
  title: 'Next360 | Organic Marketplace for Fresh, Verified, Sustainable Living',
  description:
    "Next360 connects you with verified organic stores, fresh produce, and trusted delivery partners across Hyderabad, Karimnagar & Vijayawada. Fresh. Organic. Delivered.",
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Next360 — Fresh. Organic. Delivered.',
    description:
      "India's trusted organic commerce ecosystem — verified sellers, fresh produce, flexible delivery earnings.",
    type: 'website',
    locale: 'en_IN',
    siteName: 'Next360',
    url: 'https://next360.in/',
    images: [
      {
        url: '/og/next360-cover.svg',
        width: 1200,
        height: 630,
        alt: 'Next360 — Fresh. Organic. Delivered.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next360 — Fresh. Organic. Delivered.',
    description:
      "India's trusted organic commerce ecosystem — verified sellers, fresh produce, flexible delivery earnings.",
    images: ['/og/next360-cover.svg'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://next360.in/' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${playfair.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Next360',
              url: 'https://next360.in',
              logo: 'https://next360.in/icon.svg',
              areaServed: ['Hyderabad', 'Karimnagar', 'Vijayawada'],
            }),
          }}
        />
      </head>
      <body className="font-body antialiased bg-neutral-bg text-text-primary">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
