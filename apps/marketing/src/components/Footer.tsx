import { Apple, Play } from 'lucide-react';

import { Footer as FooterPrimitive, FooterBottom, FooterColumn, FooterContent } from './ui/footer';

const footerColumns = [
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '#' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Investor Relations', href: 'mailto:investors@next360.com' },
    ],
  },
  {
    title: 'Storefronts',
    links: [
      { label: 'Organic', href: '#storefronts' },
      { label: 'Natural', href: '#storefronts' },
      { label: 'Eco-Friendly', href: '#storefronts' },
    ],
  },
  {
    title: 'For Vendors',
    links: [
      { label: 'Register as Vendor', href: '#vendors' },
      { label: 'Vendor Dashboard', href: '#' },
      { label: 'Commission & Payouts', href: '#' },
      { label: 'Vendor FAQ', href: '#' },
    ],
  },
  {
    title: 'For Delivery Partners',
    links: [
      { label: 'Become a Partner', href: '#delivery' },
      { label: 'Partner Dashboard', href: '#' },
      { label: 'Earnings & Payouts', href: '#' },
      { label: 'Partner FAQ', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', href: '#' },
      { label: 'Contact Us', href: '#' },
      { label: 'Report an Issue', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
    ],
  },
];

const zones = ['Hyderabad', 'Vijayawada'];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* Intentionally dark, independent of the site's (fixed, light-only)
   background — a closing band with visual weight to end the page,
   distinct from the white body above. Not tied to a dark-mode toggle. */
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 w-full px-4">
      <div className="max-w-container mx-auto">
        <FooterPrimitive className="text-gray-400">
          <FooterContent>
            <FooterColumn className="col-span-2 sm:col-span-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-xs leading-none">N</span>
                </div>
                <h3 className="font-display font-semibold text-white text-base">Next360</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-gray-500 tracking-wide uppercase">Live in</span>
                {zones.map((zone, i) => (
                  <span key={zone}>
                    <span className="font-mono text-[11px] text-gray-400 tracking-wide">{zone}</span>
                    {i < zones.length - 1 && <span className="text-gray-600 ml-2">·</span>}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <a href="#" className="p-2 -ml-2 rounded-lg hover:bg-gray-800 transition-colors" aria-label="Instagram">
                  <InstagramIcon className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-gray-800 transition-colors" aria-label="X (Twitter)">
                  <XIcon className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
                </a>
              </div>
            </FooterColumn>

            {footerColumns.map((col) => (
              <FooterColumn key={col.title}>
                <h3 className="font-display text-sm font-semibold text-white">{col.title}</h3>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>

          <FooterBottom className="border-gray-800 text-gray-600">
            <p className="font-mono text-[11px] tracking-wide">
              © {new Date().getFullYear()} Next360. All rights reserved. Made with care in India.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-xs font-medium hover:border-gray-500 hover:text-white transition-all"
              >
                <Apple className="w-4 h-4" />
                App Store
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-xs font-medium hover:border-gray-500 hover:text-white transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Google Play
              </a>
            </div>
          </FooterBottom>
        </FooterPrimitive>
      </div>
    </footer>
  );
}
