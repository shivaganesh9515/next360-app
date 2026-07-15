'use client';

import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-full relative transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-700 font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'V'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.name || 'Vendor'}</p>
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
