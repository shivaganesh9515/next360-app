'use client';

import { useState } from 'react';
import { Save, Bell, Shield, Store } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState({ orderUpdates: true, lowStock: true, earnings: true, promotions: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'store', label: 'Store Info', icon: Store },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your preferences and security</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Notification Preferences</h3>
          <p className="text-sm text-slate-500">Choose which notifications you&apos;d like to receive.</p>
          <div className="space-y-3">
            {[
              { key: 'orderUpdates', label: 'Order Updates', desc: 'New orders, status changes, cancellations' },
              { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Products running low on inventory' },
              { key: 'earnings', label: 'Earnings Reports', desc: 'Weekly payout summaries and transaction updates' },
              { key: 'promotions', label: 'Promotions & Offers', desc: 'Platform-wide promotional campaigns' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <input type="checkbox" checked={(notifications as any)[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Change Password</h3>
          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'store' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Store Profile</h3>
          <p className="text-sm text-slate-500">Update your store details in the <a href="/store" className="text-emerald-600 hover:text-emerald-700 font-medium">Store Profile</a> page.</p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Your store name, description, logo, and banner can all be edited from the Store Profile section.</p>
          </div>
        </div>
      )}
    </div>
  );
}
