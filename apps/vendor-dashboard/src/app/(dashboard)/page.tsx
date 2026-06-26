'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Welcome back!</h2>
        <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your store today.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Package} label="Total Products" value={stats.products} accent="emerald" />
        <StatsCard icon={ShoppingCart} label="Active Orders" value={stats.orders} accent="blue" />
        <StatsCard icon={DollarSign} label="Revenue (Month)" value={`₹${stats.revenue.toLocaleString()}`} accent="amber" />
        <StatsCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock} accent="rose" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            {[
              { href: '/products/add', label: 'Add New Product', icon: Package },
              { href: '/orders', label: 'View Orders', icon: ShoppingCart },
              { href: '/earnings', label: 'Check Earnings', icon: DollarSign },
              { href: '/inventory/low-stock', label: 'Review Stock Alerts', icon: AlertTriangle },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <action.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link href="/orders" className="text-sm text-emerald-600 hover:text-emerald-700">View all</Link>
          </div>
          <div className="text-center py-8 text-gray-400 text-sm">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No orders yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
