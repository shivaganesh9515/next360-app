'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart, Truck,
  MapPin, DollarSign, Tag, Percent, ClipboardList, Star,
  MessageSquare, BarChart3, FileText, Image, Bell, Shield,
  Settings, ChevronDown, ChevronRight, AlertTriangle, CreditCard
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/vendors', label: 'Vendors', icon: Store, subItems: [
    { href: '/vendors', label: 'All Vendors' },
    { href: '/vendors/approvals', label: 'Pending Approvals' },
  ]},
  { href: '/delivery-partners', label: 'Delivery Partners', icon: Truck, subItems: [
    { href: '/delivery-partners', label: 'All Partners' },
    { href: '/delivery-partners/approvals', label: 'Pending Approvals' },
  ]},
  { href: '/products', label: 'Products', icon: Package, subItems: [
    { href: '/products', label: 'All Products' },
    { href: '/products/add', label: 'Add Product' },
  ]},
  { href: '/categories', label: 'Categories', icon: Tag, subItems: [
    { href: '/categories', label: 'Categories' },
    { href: '/categories/sub-categories', label: 'Sub-Categories' },
  ]},
  { href: '/brands', label: 'Brands', icon: Star },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, subItems: [
    { href: '/orders', label: 'All Orders' },
    { href: '/orders/returns', label: 'Returns' },
    { href: '/orders/refunds', label: 'Refunds' },
  ]},
  { href: '/payments', label: 'Payments', icon: CreditCard, subItems: [
    { href: '/payments', label: 'Transactions' },
    { href: '/payments/vendor-payouts', label: 'Vendor Payouts' },
    { href: '/payments/delivery-payouts', label: 'Delivery Payouts' },
  ]},
  { href: '/inventory', label: 'Inventory', icon: ClipboardList },
  { href: '/coupons', label: 'Coupons', icon: Percent },
  { href: '/offers', label: 'Offers', icon: Tag },
  { href: '/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/ratings', label: 'Ratings', icon: Star },
  { href: '/ai-logs', label: 'AI Logs', icon: BarChart3, subItems: [
    { href: '/ai-logs', label: 'Chat Logs' },
    { href: '/ai-logs/recommendations', label: 'Recommendations' },
    { href: '/ai-logs/analytics', label: 'Analytics' },
  ]},
  { href: '/reports', label: 'Reports', icon: FileText, subItems: [
    { href: '/reports/sales', label: 'Sales Reports' },
    { href: '/reports/revenue', label: 'Revenue Reports' },
  ]},
  { href: '/cms', label: 'CMS', icon: Image, subItems: [
    { href: '/cms', label: 'Pages' },
    { href: '/cms/banners', label: 'Banners' },
    { href: '/cms/notifications', label: 'Notifications' },
  ]},
  { href: '/zones', label: 'Zones', icon: MapPin },
  { href: '/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/roles', label: 'Roles & Permissions', icon: Shield, subItems: [
    { href: '/roles', label: 'Roles' },
    { href: '/roles/permissions', label: 'Permissions' },
  ]},
  { href: '/settings', label: 'Settings', icon: Settings, subItems: [
    { href: '/settings', label: 'General' },
    { href: '/settings/system', label: 'System' },
  ]},
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['Vendors', 'Orders']);

  const toggleExpand = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col text-gray-300">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-semibold text-white">Next360 Admin</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href) ? 'bg-emerald-600/20 text-emerald-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {expanded.includes(item.label) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {expanded.includes(item.label) && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          pathname === sub.href ? 'bg-emerald-600/20 text-emerald-400 font-medium' : 'text-gray-500 hover:text-gray-300'
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href) ? 'bg-emerald-600/20 text-emerald-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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
