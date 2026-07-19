'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Button } from './ui/button';
import { Navbar as NavbarPrimitive, NavbarLeft, NavbarRight } from './ui/navbar';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';

const navLinks = [
  { href: '#storefronts', label: 'Storefronts' },
  { href: '#vendors', label: 'For Vendors' },
  { href: '#delivery', label: 'For Delivery Partners' },
];

export default function Navbar() {
  return (
    <header className="bg-background/90 sticky top-0 z-50 border-b border-border backdrop-blur-md">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <NavbarPrimitive>
          <NavbarLeft>
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-display font-bold text-sm leading-none">N</span>
              </div>
              <span className="font-display font-semibold text-lg text-foreground tracking-tight">Next360</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-2.5 py-1.5 -mx-2.5 -my-1.5 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </NavbarLeft>

          <NavbarRight>
            <span className="hidden lg:block font-mono text-[11px] text-muted-foreground tracking-wide uppercase">
              Serving Hyderabad &amp; Vijayawada
            </span>

            <Button variant="default" size="default" asChild className="hidden sm:inline-flex">
              <a href="#download">Download App</a>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle>Next360</SheetTitle>
                <nav className="grid gap-1 mt-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="px-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                  <a
                    href="#download"
                    className="mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Download App
                  </a>
                  <span className="mt-4 px-2 font-mono text-[11px] text-muted-foreground tracking-wide uppercase">
                    Serving Hyderabad &amp; Vijayawada
                  </span>
                </nav>
              </SheetContent>
            </Sheet>
          </NavbarRight>
        </NavbarPrimitive>
      </div>
    </header>
  );
}
