'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Store, TrendingUp, Package } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { adminApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    totalVendors: 0,
    totalUsers: 0,
    recentOrders: [] as any[],
    recentVendors: [] as any[],
    weeklyOrders: [] as { day: string; orders: number }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats({
        totalRevenue: res?.totalRevenue || 0,
        activeOrders: res?.activeOrders || 0,
        totalVendors: res?.totalVendors || 0,
        totalUsers: res?.totalUsers || 0,
        recentOrders: res?.recentOrders || [],
        recentVendors: res?.recentVendors || [],
        weeklyOrders: res?.weeklyOrders || []
      });
    } catch {
      // Dashboard data unavailable
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Welcome back. Here&apos;s what&apos;s happening on the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} accent="emerald" />
        <StatsCard icon={<ShoppingCart className="w-5 h-5" />} label="Active Orders" value={stats.activeOrders} accent="blue" />
        <StatsCard icon={<Store className="w-5 h-5" />} label="Total Vendors" value={stats.totalVendors} accent="amber" />
        <StatsCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats.totalUsers} accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Orders (Last 7 Days)</h3>
          {stats.weeklyOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.weeklyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
              No order data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Orders</h3>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">#{order.orderNumber || order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{order.customerName || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">₹{order.total?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent orders</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Vendor Registrations</h3>
          {stats.recentVendors.length > 0 ? (
            <div className="space-y-3">
              {stats.recentVendors.slice(0, 5).map((vendor: any) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-medium">
                        {vendor.storeName?.charAt(0) || 'V'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{vendor.storeName}</p>
                      <p className="text-xs text-gray-500">{vendor.ownerName || vendor.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    vendor.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    vendor.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {vendor.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No vendor registrations yet</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Pending Vendor Approvals', value: stats.totalVendors, icon: Store, color: 'text-amber-600' },
              { label: 'Platform Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
              { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart, color: 'text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
