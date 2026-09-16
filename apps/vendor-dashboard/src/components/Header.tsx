'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Store } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { vendorApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/earnings': 'Earnings',
  '/analytics': 'Analytics',
  '/customers': 'Customers',
  '/coupons': 'Coupons',
  '/offers': 'Offers',
  '/store': 'Store Profile',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/support': 'Support',
};

function titleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const parent = '/' + segments.join('/');
    if (ROUTE_TITLES[parent]) return ROUTE_TITLES[parent];
  }
  const last = pathname.split('/').filter(Boolean).pop();
  return last
    ? last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Dashboard';
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, vendorProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    vendorApi.getUnreadCount()
      .then((res) => setUnreadCount(res?.count || 0))
      .catch(() => setUnreadCount(0));
  }, [pathname]);

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{titleForPath(pathname)}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/notifications')}
          className="p-2 hover:bg-slate-100 rounded-full relative transition-colors"
          title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[10px] leading-4 text-white text-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            {vendorProfile?.logoUrl ? (
              <AvatarImage src={vendorProfile.logoUrl} alt={vendorProfile.storeName} />
            ) : (
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || vendorProfile?.storeName?.charAt(0)?.toUpperCase() || 'V'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              {vendorProfile?.storeName || user?.name || 'Vendor'}
              {vendorProfile && <Store className="w-3 h-3 text-slate-400" />}
            </p>
            <p className="text-xs text-slate-500">{user?.email || ''}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Logout">
          <LogOut className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
