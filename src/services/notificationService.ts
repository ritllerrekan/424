import { createClient } from '@supabase/supabase-js';
import type { Notification, NotificationType, NotificationSeverity, NotificationMetadata } from '../types/notification';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_KEY = 'notifications_cache';
const PERMISSION_KEY = 'notification_permission';

function saveToLocalStorage(notifications: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications to localStorage:', error);
  }
}

function loadFromLocalStorage(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notifications from localStorage:', error);
    return [];
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    localStorage.setItem(PERMISSION_KEY, 'granted');
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    localStorage.setItem(PERMISSION_KEY, permission);
    return permission;
  }

  return Notification.permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

function showBrowserNotification(title: string, options: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  metadata?: NotificationMetadata;
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity || 'info',
        metadata: params.metadata || {},
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    if (data) {
      const cached = loadFromLocalStorage();
      saveToLocalStorage([data, ...cached]);

      showBrowserNotification(data.title, {
        body: data.message,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: data.id,
        requireInteraction: data.severity === 'error',
        silent: data.severity === 'info'
      });
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      const cached = loadFromLocalStorage();
      return cached.filter(n => n.user_id === userId).slice(0, limit);
    }

    if (data) {
      saveToLocalStorage(data);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const cached = loadFromLocalStorage();
    return cached.filter(n => n.user_id === userId).slice(0, limit);
  }
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    const cached = loadFromLocalStorage();
    const updated = cached.map(n =>
      n.id === notificationId
        ? { ...n, is_read: true, read_at: new Date().toISOString() }
        : n
    );
    saveToLocalStorage(updated);

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    const cached = loadFromLocalStorage();
    const updated = cached.map(n =>
      n.user_id === userId && !n.is_read
        ? { ...n, is_read: true, read_at: new Date().toISOString() }
        : n
    );
    saveToLocalStorage(updated);

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    const cached = loadFromLocalStorage();
    const updated = cached.filter(n => n.id !== notificationId);
    saveToLocalStorage(updated);

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return false;
  }
}

export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const notification = payload.new as Notification;

        const cached = loadFromLocalStorage();
        saveToLocalStorage([notification, ...cached]);

        showBrowserNotification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
          badge: '/badge.png',
          tag: notification.id,
          requireInteraction: notification.severity === 'error',
          silent: notification.severity === 'info'
        });

        callback(notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function notifyBatchUpdate(
  userId: string,
  batchId: string,
  batchNumber: string,
  newPhase: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'phase_change',
    title: 'Batch Phase Updated',
    message: `Batch ${batchNumber} has moved to ${newPhase} phase`,
    severity: 'success',
    metadata: {
      batch_id: batchId,
      batch_number: batchNumber,
      phase: newPhase
    }
  });
}

export async function notifyQualityIssue(
  userId: string,
  batchId: string,
  batchNumber: string,
  qualityScore: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'quality_issue',
    title: 'Quality Issue Detected',
    message: `Batch ${batchNumber} has a low quality score of ${qualityScore}`,
    severity: 'warning',
    metadata: {
      batch_id: batchId,
      batch_number: batchNumber,
      quality_score: qualityScore
    }
  });
}

export async function notifyBatchRejection(
  userId: string,
  batchId: string,
  batchNumber: string,
  reason: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'batch_rejection',
    title: 'Batch Rejected',
    message: `Batch ${batchNumber} has been rejected: ${reason}`,
    severity: 'error',
    metadata: {
      batch_id: batchId,
      batch_number: batchNumber,
      rejection_reason: reason
    }
  });
}

export async function notifyWasteThreshold(
  userId: string,
  wasteAmount: number,
  threshold: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'waste_threshold',
    title: 'Waste Threshold Exceeded',
    message: `Waste amount ${wasteAmount}kg has exceeded the threshold of ${threshold}kg`,
    severity: 'warning',
    metadata: {
      waste_amount: wasteAmount,
      threshold: threshold
    }
  });
}

export async function notifyTransactionConfirmation(
  userId: string,
  transactionHash: string,
  batchNumber: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'transaction_confirmation',
    title: 'Transaction Confirmed',
    message: `Transaction for batch ${batchNumber} has been confirmed on the blockchain`,
    severity: 'success',
    metadata: {
      transaction_hash: transactionHash,
      batch_number: batchNumber
    }
  });
}
