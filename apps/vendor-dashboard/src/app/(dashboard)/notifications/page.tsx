'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { vendorApi } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getNotifications().then((res: any) => setNotifications(Array.isArray(res) ? res : []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try { await vendorApi.markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n)); }
    catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try { await vendorApi.markAllNotificationsRead(); setNotifications(prev => prev.map(n => ({...n, isRead: true}))); }
    catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="space-y-4" role="status" aria-label="Loading notifications">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <span className="sr-only">Loading notifications...</span>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold text-slate-900">Notifications</h2><p className="text-sm text-slate-500">{notifications.filter(n => !n.isRead).length} unread</p></div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><CheckCheck className="w-4 h-4" /> Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${n.isRead ? 'border-slate-200' : 'border-emerald-200 bg-emerald-50/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.body}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-4">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
