'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Check, X, MailOpen, Mail } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { adminApi, api } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ title: '', body: '', type: 'SYSTEM' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications();
      const data = res?.data || res || [];
      if (data.notifications) {
        setNotifications(data.notifications);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await adminApi.sendNotification(sendForm);
      setShowSendModal(false);
      setSendForm({ title: '', body: '', type: 'SYSTEM' });
      showSuccess('Notification sent');
      loadNotifications();
    } catch (err: any) {
      // Backend may not expose POST /notifications — show a graceful message
      showError(
        err.message?.includes('404') || err.message?.includes('not found')
          ? 'Send notification is not available yet — the backend endpoint is being built.'
          : err.message || 'Failed to send notification',
      );
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch {
      // Silently fail — read status is non-critical
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (n: any) => (
        <div className="flex items-center gap-2">
          {n.isRead ? (
            <MailOpen className="w-3.5 h-3.5 text-gray-300" />
          ) : (
            <Mail className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className={`text-sm ${n.isRead ? 'text-gray-600' : 'font-medium text-gray-800'}`}>
            {n.title}
          </span>
        </div>
      ),
    },
    {
      key: 'body',
      label: 'Message',
      render: (n: any) => (
        <span className="text-xs text-gray-500 truncate max-w-[200px] block">
          {n.body || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (n: any) => <StatusBadge status={n.type} />,
    },
    {
      key: 'createdAt',
      label: 'Sent',
      render: (n: any) => (
        <span className="text-xs text-gray-400">
          {new Date(n.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (n: any) => (
        <div className="flex justify-end">
          {!n.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkRead(n.id);
              }}
              className="p-1.5 hover:bg-gray-100 rounded text-xs text-emerald-600"
              title="Mark as read"
            >
              Mark read
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Flash messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-amber-400 hover:text-amber-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
          <p className="text-sm text-gray-500">View and manage system notifications</p>
        </div>
        <button
          onClick={() => {
            setSendForm({ title: '', body: '', type: 'SYSTEM' });
            setShowSendModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          <Send className="w-4 h-4" /> Send Notification
        </button>
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        searchable
        searchPlaceholder="Search notifications..."
        emptyMessage={
          <div className="py-6 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500 mb-1">No notifications yet</p>
            <p className="text-xs text-gray-400">
              Notifications will appear here when users receive them.
            </p>
          </div>
        }
        emptyIcon={null}
      />

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Notification</h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Title *</label>
                <input
                  type="text"
                  required
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. New Sale Starts Tomorrow"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Message *</label>
                <textarea
                  required
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-emerald-500"
                  placeholder="Notification message..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Type</label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="SYSTEM">System</option>
                  <option value="ORDER">Order</option>
                  <option value="PROMO">Promotional</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
