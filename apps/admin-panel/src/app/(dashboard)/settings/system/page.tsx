'use client';

import Link from 'next/link';
import { ArrowLeft, Server, Database, Globe, Shield, Clock, AlertTriangle, Lock } from 'lucide-react';

interface SystemField {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const systemInfo: SystemField[] = [
  { label: 'Application', value: 'Next360 Admin Panel', icon: <Server className="w-4 h-4" /> },
  { label: 'Framework', value: 'Next.js 16 (Turboback)', icon: <Globe className="w-4 h-4" /> },
  { label: 'Backend', value: 'NestJS + Prisma', icon: <Database className="w-4 h-4" /> },
  { label: 'Database', value: 'Supabase PostgreSQL', icon: <Database className="w-4 h-4" /> },
  { label: 'Auth Provider', value: 'Supabase Auth + JWT', icon: <Shield className="w-4 h-4" /> },
  { label: 'Payment Gateway', value: 'Razorpay', icon: <Globe className="w-4 h-4" /> },
];

export default function SystemSettingsPage() {
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

      {/* Pending backend notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Backend integration pending</p>
          <p className="text-xs text-amber-600 mt-1">
            System settings are read-only until the backend admin settings endpoint is implemented.
            Toggle states shown here are for preview purposes only.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-500" />
            System Information
          </h3>
          <div className="space-y-3">
            {systemInfo.map((field) => (
              <div key={field.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {field.icon}
                  {field.label}
                </div>
                <span className="text-sm font-medium text-gray-800">{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session & Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Session & Security
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Enforce HTTPS</p>
                  <p className="text-xs text-gray-500">Force all connections over HTTPS</p>
                </div>
              </div>
              <input type="checkbox" checked readOnly disabled className="rounded border-gray-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Rate Limiting</p>
                  <p className="text-xs text-gray-500">API rate limiting (10 req/s, 5/min auth)</p>
                </div>
              </div>
              <input type="checkbox" checked readOnly disabled className="rounded border-gray-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">CORS Protection</p>
                  <p className="text-xs text-gray-500">Restrict API access to registered domains</p>
                </div>
              </div>
              <input type="checkbox" checked readOnly disabled className="rounded border-gray-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Query Logging</p>
                  <p className="text-xs text-gray-500">Log slow database queries (&gt;500ms)</p>
                </div>
              </div>
              <input type="checkbox" checked readOnly disabled className="rounded border-gray-300 text-emerald-600" />
            </label>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            Maintenance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Disable public access to the platform</p>
              </div>
              <input type="checkbox" readOnly disabled className="rounded border-gray-300 text-amber-600" />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Read-Only Mode</p>
                <p className="text-xs text-gray-500">Allow browsing but disable all writes</p>
              </div>
              <input type="checkbox" readOnly disabled className="rounded border-gray-300 text-amber-600" />
            </label>
          </div>
        </div>
      </div>

      {/* Save Button (disabled) */}
      <div className="flex justify-end">
        <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed">
          Save Changes
        </button>
      </div>
    </div>
  );
}
