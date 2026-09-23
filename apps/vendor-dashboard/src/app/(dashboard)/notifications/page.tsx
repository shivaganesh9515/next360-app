'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, RotateCcw } from 'lucide-react';
import { vendorApi } from '@/lib/api';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    vendorApi.getNotifications().then((res: any) => {
      // Backend returns { notifications: [...], total, unreadCount } or an array
      const items = res?.notifications || (Array.isArray(res) ? res : []);
      if (!cancelled) setNotifications(Array.isArray(items) ? items : []);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const retry = () => {
    setLoading(true);
    setError(null);
    vendorApi.getNotifications().then((res: any) => {
      const items = res?.notifications || (Array.isArray(res) ? res : []);
      setNotifications(Array.isArray(items) ? items : []);
    }).catch((err) => setError(err instanceof Error ? err : new Error(String(err)))).finally(() => setLoading(false));
  };

  const handleClick = async (n: any) => {
    // Mark as read first
    if (!n.isRead) {
      try {
        await vendorApi.markNotificationRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? {...x, isRead: true} : x));
      } catch (e) { console.error(e); }
    }

    // Navigate to order detail if notification has an order reference in its data
    const orderId = n.data?.orderId;
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
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

  if (error) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold text-slate-900">Notifications</h2></div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
          <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-3">
            <Bell className="w-5 h-5 text-rose-500" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-700">Couldn&apos;t load notifications</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          {notifications.map((n) => {
            const hasOrderLink = !!n.data?.orderId;
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                  n.isRead ? 'border-slate-200' : 'border-emerald-200 bg-emerald-50/30'
                } ${hasOrderLink && !n.isRead ? 'hover:border-emerald-400' : 'hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.body}</p>
                    {hasOrderLink && (
                      <span className="text-xs text-emerald-600 mt-1 inline-block font-medium">View order →</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-4">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
