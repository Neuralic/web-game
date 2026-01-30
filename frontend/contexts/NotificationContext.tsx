"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notificationsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id?: string;
  related_item_id?: string;
  related_username?: string;
  related_display_name?: string;
  related_avatar_url?: string;
  related_is_verified?: boolean;
}

interface Toast {
  id: string;
  notification: Notification;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toasts: Toast[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  dismissToast: (toastId: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  toasts: [],
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
  dismissToast: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshNotifications = async () => {
    if (!isAuthenticated()) return;

    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications(),
        notificationsApi.getUnreadCount(),
      ]);

      if (notifResponse.success && notifResponse.data) {
        setNotifications(notifResponse.data.notifications);
      }

      if (countResponse.success && countResponse.data) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const dismissToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const showToast = (notification: Notification) => {
    const toast: Toast = {
      id: `${notification.id}-${Date.now()}`,
      notification,
    };
    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(toast.id);
    }, 5000);
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated()) return;

    refreshNotifications();
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!isAuthenticated()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`,
        },
        (payload: any) => {
          const newNotification = {
            id: payload.new.id,
            type: payload.new.type,
            content: payload.new.content,
            is_read: payload.new.isRead,
            created_at: payload.new.createdAt,
            related_user_id: payload.new.relatedUserId,
            related_item_id: payload.new.relatedItemId,
          };

          // Add to notifications list
          setNotifications(prev => [newNotification as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          showToast(newNotification as Notification);

          console.log('🔔 New notification received:', newNotification);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
