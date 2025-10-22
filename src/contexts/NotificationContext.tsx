import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types/notification';
import {
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  requestNotificationPermission,
  getNotificationPermission
} from '../services/notificationService';
import { useWeb3Auth } from './Web3AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  notificationPermission: NotificationPermission;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useWeb3Auth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  const requestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  };

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const [allNotifications, unreadNotifications] = await Promise.all([
        getUserNotifications(user.email || user.name || ''),
        getUnreadNotifications(user.email || user.name || '')
      ]);

      setNotifications(allNotifications);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markNotificationAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    const success = await markAllAsRead(user.email || user.name || '');
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  };

  const removeNotification = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        const newNotifications = prev.filter(n => n.id !== id);

        if (notification && !notification.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }

        return newNotifications;
      });
    }
  };

  useEffect(() => {
    if (user) {
      refreshNotifications();

      const unsubscribe = subscribeToNotifications(
        user.email || user.name || '',
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      );

      return unsubscribe;
    }
  }, [user, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        notificationPermission,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
        requestPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
