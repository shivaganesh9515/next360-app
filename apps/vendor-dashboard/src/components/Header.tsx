'use client';

import { Bell, LogOut, Menu, Store } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, vendorProfile, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await vendorApi.getUnreadCount();
        if (active && res?.count !== undefined) {
          setUnreadCount(res.count);
        }
      } catch (e) {
        // Silently fail — badge just won't show
      }
    };
    fetchUnreadCount();
    // Poll every 60 seconds to keep badge current
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="p-2 hover:bg-slate-100 rounded-full relative transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
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
