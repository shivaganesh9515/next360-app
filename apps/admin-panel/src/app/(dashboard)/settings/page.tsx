'use client';

import { useState } from 'react';
import { Settings, Save, Key, Bell, Globe, Shield } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: 'Next360',
    supportEmail: 'support@next360.com',
    defaultCommissionPct: 15,
    codEnabled: true,
    codCapAmount: 2000,
    minOrderAmount: 100,
    maxOrderAmount: 50000,
    deliveryPartnerPayoutFrequency: 'weekly',
    autoApproveVendors: false,
    autoApproveProducts: false,
    maintenanceMode: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try { await adminApi.updateSettings(settings); alert('Settings saved'); }
    catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'payments', label: 'Payments', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-gray-800">Settings</h2><p className="text-sm text-gray-500">Platform configuration and preferences</p></div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Platform</h3>
            <div><label className="text-sm text-gray-600 mb-1 block">Platform Name</label><input type="text" value={settings.platformName} onChange={e => setSettings({ ...settings, platformName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm text-gray-600 mb-1 block">Support Email</label><input type="email" value={settings.supportEmail} onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Approval</h3>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={settings.autoApproveVendors} onChange={e => setSettings({ ...settings, autoApproveVendors: e.target.checked })} className="rounded" /><div><p className="text-sm font-medium">Auto-Approve Vendors</p><p className="text-xs text-gray-500">Skip manual approval for new vendors</p></div></label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={settings.autoApproveProducts} onChange={e => setSettings({ ...settings, autoApproveProducts: e.target.checked })} className="rounded" /><div><p className="text-sm font-medium">Auto-Approve Products</p><p className="text-xs text-gray-500">Skip manual approval for new products</p></div></label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-amber-200"><input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="rounded" /><div><p className="text-sm font-medium text-amber-700">Maintenance Mode</p><p className="text-xs text-gray-500">Disable public access to the platform</p></div></label>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Commission</h3>
            <div><label className="text-sm text-gray-600 mb-1 block">Default Commission Rate (%)</label><input type="number" min="0" max="100" value={settings.defaultCommissionPct} onChange={e => setSettings({ ...settings, defaultCommissionPct: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">COD Settings</h3>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={settings.codEnabled} onChange={e => setSettings({ ...settings, codEnabled: e.target.checked })} className="rounded" /><div><p className="text-sm font-medium">Enable COD</p><p className="text-xs text-gray-500">Allow cash on delivery payments</p></div></label>
            <div><label className="text-sm text-gray-600 mb-1 block">COD Cap (₹)</label><input type="number" value={settings.codCapAmount} onChange={e => setSettings({ ...settings, codCapAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Order Limits</h3>
            <div><label className="text-sm text-gray-600 mb-1 block">Min Order Amount (₹)</label><input type="number" value={settings.minOrderAmount} onChange={e => setSettings({ ...settings, minOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm text-gray-600 mb-1 block">Max Order Amount (₹)</label><input type="number" value={settings.maxOrderAmount} onChange={e => setSettings({ ...settings, maxOrderAmount: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Payouts</h3>
            <div><label className="text-sm text-gray-600 mb-1 block">Partner Payout Frequency</label>
              <select value={settings.deliveryPartnerPayoutFrequency} onChange={e => setSettings({ ...settings, deliveryPartnerPayoutFrequency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Notification Settings</h3>
          <p className="text-sm text-gray-500">Push notification and email settings will be configured here.</p>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Security Settings</h3>
          <p className="text-sm text-gray-500">RBAC, API keys, and session management settings will be configured here.</p>
        </div>
      )}
    </div>
  );
}
