'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, ShoppingCart, Tag, Users,
  BarChart3, DollarSign, Store, Bell, Settings, HelpCircle,
  ChevronDown, ChevronRight, Box, AlertTriangle, Percent, Receipt
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package, subItems: [
    { href: '/products', label: 'All Products' },
    { href: '/products/add', label: 'Add Product' },
    { href: '/categories', label: 'Categories' },
  ]},
  { href: '/inventory', label: 'Inventory', icon: ClipboardList, subItems: [
    { href: '/inventory', label: 'Stock Management' },
    { href: '/inventory/low-stock', label: 'Low Stock Alerts' },
  ]},
  { href: '/orders', label: 'Orders', icon: ShoppingCart, subItems: [
    { href: '/orders', label: 'All Orders' },
    { href: '/orders/returns', label: 'Returns' },
  ]},
  { href: '/coupons', label: 'Promotions', icon: Tag, subItems: [
    { href: '/coupons', label: 'Coupons' },
    { href: '/offers', label: 'Offers' },
  ]},
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, subItems: [
    { href: '/analytics', label: 'Overview' },
    { href: '/analytics/sales', label: 'Sales' },
    { href: '/analytics/revenue', label: 'Revenue' },
  ]},
  { href: '/earnings', label: 'Earnings', icon: DollarSign, subItems: [
    { href: '/earnings', label: 'Overview' },
    { href: '/earnings/payouts', label: 'Payouts' },
    { href: '/earnings/transactions', label: 'Transactions' },
  ]},
  { href: '/store', label: 'Store Profile', icon: Store },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(() => {
    return navItems
      .filter(item => item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href)))
      .map(item => item.label);
  });

  useEffect(() => {
    setExpanded(prev => {
      const autoExpand = navItems
        .filter(item => item.subItems && item.subItems.some(sub => pathname.startsWith(sub.href)))
        .map(item => item.label);
      const merged = new Set([...prev, ...autoExpand]);
      return Array.from(merged);
    });
  }, [pathname]);

  const toggleExpand = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">Next360 Vendor</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    isActive(item.href) ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {expanded.includes(item.label) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expanded.includes(item.label) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                          pathname === sub.href ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                  isActive(item.href) ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
