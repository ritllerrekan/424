import { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification, NotificationSeverity } from '../types/notification';
import { GlassCard } from './glass/GlassCard';
import { GlassButton } from './glass/GlassButton';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    notificationPermission,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    requestPermission
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const getSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityBg = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          <div
            className="absolute top-20 right-4 w-96 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard>
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>

                {notificationPermission === 'default' && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-white/70 mb-2">
                      Enable browser notifications to stay updated
                    </p>
                    <GlassButton
                      onClick={handleRequestPermission}
                      className="w-full text-sm"
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      Enable Notifications
                    </GlassButton>
                  </div>
                )}

                {notificationPermission === 'denied' && (
                  <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-white/60">
                      Notifications are blocked. Enable them in your browser settings.
                    </p>
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadCount === 0}
                      className="flex-1 text-sm"
                    >
                      <CheckCheck className="w-4 h-4 mr-1" />
                      Mark All Read
                    </GlassButton>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="p-8 text-center text-white/50">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-white/50">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-white/5' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg border ${getSeverityBg(notification.severity)} flex-shrink-0`}>
                            {getSeverityIcon(notification.severity)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>

                            <p className="text-sm text-white/70 mb-2">{notification.message}</p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/50">
                                {formatTimestamp(notification.created_at)}
                              </span>

                              <div className="flex gap-1">
                                {!notification.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationAsRead(notification.id);
                                    }}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4 text-white/70" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="p-1 rounded hover:bg-white/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-white/70" />
                                </button>
                              </div>
                            </div>

                            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                              <div className="mt-2 p-2 rounded bg-black/20 text-xs text-white/60">
                                {notification.metadata.batch_number && (
                                  <div>Batch: {notification.metadata.batch_number}</div>
                                )}
                                {notification.metadata.transaction_hash && (
                                  <div className="truncate">
                                    TX: {notification.metadata.transaction_hash.slice(0, 10)}...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
