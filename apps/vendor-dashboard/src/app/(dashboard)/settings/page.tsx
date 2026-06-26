'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({ orderUpdates: true, lowStock: true, earnings: false, promotions: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage('');
    if (form.newPassword !== form.confirmPassword) { setMessage('Passwords do not match'); return; }
    setSaving(true);
    setTimeout(() => { setMessage('Password updated successfully'); setSaving(false); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }, 1000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div><h2 className="text-xl font-bold text-gray-800">Settings</h2><p className="text-sm text-gray-500">Manage your preferences</p></div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { key: 'orderUpdates', label: 'Order Updates' },
            { key: 'lowStock', label: 'Low Stock Alerts' },
            { key: 'earnings', label: 'Earnings Reports' },
            { key: 'promotions', label: 'Promotions & Offers' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={(notifications as any)[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
        {message && <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={form.currentPassword} onChange={(e) => setForm({...form, currentPassword: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={form.newPassword} onChange={(e) => setForm({...form, newPassword: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
