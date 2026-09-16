'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const navLinks = [
  { label: 'For Customers', href: '#how-it-works' },
  { label: 'For Sellers', href: '/sellers' },
  { label: 'For Delivery Partners', href: '/partners' },
  { label: 'Why Next360', href: '#why' },
  { label: 'FAQ', href: '#faq' },
];

function scrollToSection(href: string) {
  const id = href.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function isHashHref(href: string) {
  return href.startsWith('#');
}

const sectionIds = ['how-it-works', 'categories', 'why', 'grow', 'faq'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // ── IntersectionObserver: track which section is in view ──
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const obs of observers) obs.disconnect();
    };
  }, []);

  // ── Determine if a nav item maps to the currently active section ──
  const isActive = (href: string) => {
    if (!isHashHref(href)) return false;
    const id = href.replace('#', '');
    return activeSection === id;
  };

  return (
    <>
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-neutral-bg/95 backdrop-blur-lg border-b border-neutral-surface shadow-sm'
            : 'bg-neutral-bg/70 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5">
              <span className="font-display font-semibold text-lg text-brand-primary">
                Next360
              </span>
            </a>

            {/* Desktop nav — crawlable anchors with active indicator */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
              {navLinks.map((l) => {
                const active = isActive(l.href);
                const key = `${l.label}-${l.href}`;
                const className = `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-text-secondary hover:text-brand-primary hover:bg-brand-primary/5'
                }`;
                if (isHashHref(l.href)) {
                  return (
                    <a
                      key={key}
                      href={l.href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(l.href);
                        setMobileOpen(false);
                      }}
                      aria-current={active ? 'true' : undefined}
                      className={className}
                    >
                      {l.label}
                    </a>
                  );
                }
                return (
                  <Link key={key} href={l.href} className={className}>
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-4">
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('#how-it-works');
                }}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn hover:scale-105 transition-all duration-300"
              >
                Get started
              </a>
              {/* Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex flex-col gap-1 p-2"
                aria-label="Toggle menu"
              >
                <span className={`block w-5 h-px bg-brand-primary transition-all duration-300 ${
                  mobileOpen ? 'rotate-45 translate-y-[3px]' : ''
                }`} />
                <span className={`block w-5 h-px bg-brand-primary transition-all duration-300 ${
                  mobileOpen ? 'opacity-0' : ''
                }`} />
                <span className={`block w-5 h-px bg-brand-primary transition-all duration-300 ${
                  mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-neutral-bg transition-all duration-500 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '64px' }}
      >
        <nav className="flex flex-col gap-4 p-8 pt-12" aria-label="Mobile">
          {navLinks.map((l) =>
            isHashHref(l.href) ? (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(l.href);
                  setMobileOpen(false);
                }}
                className="text-left text-2xl font-display font-medium text-brand-primary hover:text-brand-accent transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-left text-2xl font-display font-medium text-brand-primary hover:text-brand-accent transition-colors"
              >
                {l.label}
              </Link>
            )
          )}
          <div className="pt-6 border-t border-neutral-surface">
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('#how-it-works');
                setMobileOpen(false);
              }}
              className="inline-flex px-6 py-3 rounded-full bg-brand-accent text-white text-sm font-semibold shadow-btn"
            >
              Get started
            </a>
          </div>
        </nav>
      </div>
    </>
  );
}
