'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Key, Bell, Globe, Shield, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex gap-1 p-1 rounded-lg w-fit">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-9 w-24 bg-slate-100 rounded-md animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    defaultCommissionPct: 10,
    codEnabled: true,
    codCapAmount: 2000,
    minOrderAmount: 100,
    maxOrderAmount: 50000,
    deliveryPartnerPayoutFreq: 'weekly',
    autoApproveVendors: false,
    autoApproveProducts: false,
    maintenanceMode: false,
    newOrderAlerts: true,
    vendorRegistrationAlerts: true,
    disputeAlerts: true,
    dailySummary: true,
    weeklyReport: false,
    alertEmail: 'admin@next360.com',
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      const d = res?.data || res;
      if (d) {
        setSettings({
          platformName: d.platformName || 'Next360',
          supportEmail: d.supportEmail || 'support@next360.com',
          defaultCommissionPct: d.defaultCommissionPct ?? 10,
          codEnabled: d.codEnabled ?? true,
          codCapAmount: d.codCapAmount ?? 2000,
          minOrderAmount: d.minOrderAmount ?? 100,
          maxOrderAmount: d.maxOrderAmount ?? 50000,
          deliveryPartnerPayoutFreq: d.deliveryPartnerPayoutFreq || 'weekly',
          autoApproveVendors: d.autoApproveVendors ?? false,
          autoApproveProducts: d.autoApproveProducts ?? false,
          maintenanceMode: d.maintenanceMode ?? false,
          newOrderAlerts: d.newOrderAlerts ?? true,
          vendorRegistrationAlerts: d.vendorRegistrationAlerts ?? true,
          disputeAlerts: d.disputeAlerts ?? true,
          dailySummary: d.dailySummary ?? true,
          weeklyReport: d.weeklyReport ?? false,
          alertEmail: d.alertEmail || 'admin@next360.com',
        });
      }
    } catch {
      // Use defaults if server unavailable
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      alert('Settings saved successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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
              <select value={settings.deliveryPartnerPayoutFreq} onChange={e => setSettings({ ...settings, deliveryPartnerPayoutFreq: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Push Notifications</h3>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={settings.newOrderAlerts} onChange={e => setSettings({...settings, newOrderAlerts: e.target.checked})} className="rounded" />
              <div><p className="text-sm font-medium">New Order Alerts</p><p className="text-xs text-gray-500">Notify admin when a new order is placed</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={settings.vendorRegistrationAlerts} onChange={e => setSettings({...settings, vendorRegistrationAlerts: e.target.checked})} className="rounded" />
              <div><p className="text-sm font-medium">Vendor Registration</p><p className="text-xs text-gray-500">Notify when a new vendor signs up</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={settings.disputeAlerts} onChange={e => setSettings({...settings, disputeAlerts: e.target.checked})} className="rounded" />
              <div><p className="text-sm font-medium">Dispute Alerts</p><p className="text-xs text-gray-500">Notify when a return or refund is requested</p></div>
            </label>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Email Notifications</h3>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={settings.dailySummary} onChange={e => setSettings({...settings, dailySummary: e.target.checked})} className="rounded" />
              <div><p className="text-sm font-medium">Daily Summary</p><p className="text-xs text-gray-500">Receive daily platform performance email</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={settings.weeklyReport} onChange={e => setSettings({...settings, weeklyReport: e.target.checked})} className="rounded" />
              <div><p className="text-sm font-medium">Weekly Report</p><p className="text-xs text-gray-500">Receive weekly analytics and revenue report</p></div>
            </label>
            <div><label className="text-sm text-gray-600 mb-1 block">Alert Email</label><input type="email" value={settings.alertEmail} onChange={e => setSettings({...settings, alertEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Session Management</h3>
            <div><label className="text-sm text-gray-600 mb-1 block">Session Timeout (minutes)</label><input type="number" defaultValue={60} min={5} max={480} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={true} readOnly className="rounded" />
              <div><p className="text-sm font-medium">Require re-auth for sensitive actions</p><p className="text-xs text-gray-500">Password confirmation for vendor approval, settings changes</p></div>
            </label>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">API Access</h3>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={true} readOnly className="rounded" />
              <div><p className="text-sm font-medium">Rate Limiting</p><p className="text-xs text-gray-500">10 requests/second default, 5/minute for auth endpoints</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input type="checkbox" checked={true} readOnly className="rounded" />
              <div><p className="text-sm font-medium">CORS Protection</p><p className="text-xs text-gray-500">Restrict API access to registered domains only</p></div>
            </label>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-700">Admin Roles</p>
              <p className="text-xs text-gray-500 mt-1">Manage role-based access control for admin users in the Roles section.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
