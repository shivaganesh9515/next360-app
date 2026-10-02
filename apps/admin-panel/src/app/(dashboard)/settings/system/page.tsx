'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Server, Database, Globe, Shield, Clock, AlertTriangle, Loader2,
  CheckCircle2, Info, ExternalLink
} from 'lucide-react';
import { adminApi } from '@/lib/api';

/**
 * Build-time and infrastructure facts. None of these are `PlatformSettings`
 * columns — they describe how the stack is deployed, not a value the API can
 * read or write, so they render as static text and are never sent to the server.
 *
 * The rate-limit figures are the values actually configured in
 * `apps/api/src/app.module.ts` (default: ttl 1000ms / limit 30) and
 * `auth.controller.ts` (@Throttle 5 per 60s on the login route), not estimates.
 */
const platformStack = [
  { label: 'Application', value: 'Next360 Admin Panel', icon: <Server className="w-4 h-4" /> },
  { label: 'Framework', value: 'Next.js 16 (Turbopack)', icon: <Globe className="w-4 h-4" /> },
  { label: 'Backend', value: 'NestJS + Prisma', icon: <Database className="w-4 h-4" /> },
  { label: 'Database', value: 'Supabase PostgreSQL', icon: <Database className="w-4 h-4" /> },
  { label: 'Auth Provider', value: 'Supabase Auth + JWT', icon: <Shield className="w-4 h-4" /> },
  { label: 'Payment Gateway', value: 'Razorpay', icon: <Globe className="w-4 h-4" /> },
];

/**
 * Security posture. These are implemented in the API's bootstrap and guards, but
 * they are not `PlatformSettings` columns, so they are shown as read-only
 * descriptions. They deliberately have no checkbox — a disabled toggle implies
 * a setting exists somewhere that can be turned off, which is not the case.
 */
const securityFacts = [
  {
    label: 'Rate Limiting',
    detail: '30 requests/second globally, 5 per minute on the login route',
    icon: <Clock className="w-4 h-4" />,
  },
  {
    label: 'CORS Protection',
    detail: 'Explicit origin allowlist from CORS_ORIGINS — no wildcard',
    icon: <Globe className="w-4 h-4" />,
  },
];

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The single writable field on this page. `PlatformSettings` (schema.prisma)
  // has no HTTPS, query-logging or read-only-mode column, so only maintenanceMode
  // is editable here; the remaining ten configurable fields live on /settings.
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const d = res?.data || res;
      setMaintenanceMode(!!d?.maintenanceMode);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load settings from the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      // Only the whitelisted key is sent. AdminService.updateSettings silently
      // drops unknown keys, so sending the whole object would look like it
      // worked while quietly discarding everything.
      const updated = await adminApi.updateSettings({ maintenanceMode });
      const d = updated?.data || updated;
      if (d && typeof d.maintenanceMode === 'boolean') setMaintenanceMode(d.maintenanceMode);
      setSaved(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-56 bg-white rounded-xl border border-gray-200 animate-pulse" />
        <div className="h-56 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/settings" className="hover:text-emerald-600 transition-colors">Settings</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">System</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">System Settings</h2>
          <p className="text-sm text-gray-500">Platform infrastructure and system configuration</p>
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">{loadError}</p>
          <button
            onClick={loadSettings}
            className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information — informational */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-500" />
              System Information
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
              <Info className="w-3 h-3" />
              Informational
            </span>
          </div>
          <div className="space-y-3">
            {platformStack.map((field) => (
              <div key={field.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {field.icon}
                  {field.label}
                </div>
                <span className="text-sm font-medium text-gray-800">{field.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            These describe the deployed stack. They are not stored in the database and
            cannot be edited from the admin panel.
          </p>
        </div>

        {/* Session & Security — informational, no toggles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Session & Security
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
              <Shield className="w-3 h-3" />
              Enforced by the API
            </span>
          </div>
          <div className="space-y-3">
            {securityFacts.map((fact) => (
              <div key={fact.label} className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-gray-500">{fact.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{fact.label}</p>
                    <p className="text-xs text-gray-500">{fact.detail}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Applied globally in the API bootstrap and guards. Changing them requires a
            redeploy, not an admin setting.
          </p>
        </div>

        {/* Maintenance — the one writable field on this page */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            Maintenance
          </h3>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-xs text-gray-500">Disable public access to the platform</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              disabled={saving}
              onChange={(e) => { setMaintenanceMode(e.target.checked); setSaved(false); }}
              className="rounded border-gray-300 text-amber-600 disabled:opacity-50"
            />
          </label>
          <p className="text-xs text-gray-400">
            Saved to <span className="font-mono">PlatformSettings.maintenanceMode</span> via{' '}
            <span className="font-mono">PATCH /api/admin/settings</span>. Only this field is
            editable on this page —{' '}
            <Link href="/settings" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 font-medium">
              the other ten platform settings live under General
              <ExternalLink className="w-3 h-3" />
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Save status + button */}
      <div className="flex items-center justify-end gap-3">
        {saved && !saveError && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
        {saveError && (
          <span className="text-sm text-red-600">{saveError}</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !!loadError}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}