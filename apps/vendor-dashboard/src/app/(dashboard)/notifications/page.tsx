'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { vendorApi } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorApi.getNotifications().then((res: any) => setNotifications(Array.isArray(res) ? res : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try { await vendorApi.markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n)); }
    catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try { await vendorApi.markAllNotificationsRead(); setNotifications(prev => prev.map(n => ({...n, isRead: true}))); }
    catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-bold text-gray-800">Notifications</h2><p className="text-sm text-gray-500">{notifications.filter(n => !n.isRead).length} unread</p></div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"><CheckCheck className="w-4 h-4" /> Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${n.isRead ? 'border-gray-200' : 'border-emerald-200 bg-emerald-50/30'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{n.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.body}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
