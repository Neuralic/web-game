"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notificationsApi } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { isConversationViewed } from '@/lib/chatViewing';

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

    setTimeout(() => {
      dismissToast(toast.id);
    }, 5000);
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated()) return;
    refreshNotifications();
  }, []);

  // Reading a chat clears that chat's message notifications on the server: reload the bell's count and list
  useEffect(() => {
    const onChatRead = () => { refreshNotifications(); };
    window.addEventListener('ab:chat-read', onChatRead);
    return () => window.removeEventListener('ab:chat-read', onChatRead);
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!isAuthenticated()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let userId: string;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.userId;
    } catch {
      return;
    }

    // The Supabase client is loaded here, for signed-in users only (a require() at the top of this effect made it part of every
    // page's JavaScript, for logged-out visitors too). Missing Supabase settings (local testing) just turn live notifications off.
    let channel: any = null;
    let cancelled = false;
    const subscribe = (supabase: typeof import('@/lib/supabase').supabase) => {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${userId}`,
          },
          async (event: any) => {
            const raw = event.new;

            // A message from the person whose chat is open and in front is already being read:
            // no bell count, no toast (and mark it read so it can't linger as unread)
            if ((raw.type === 'message' || raw.type === 'new_message') && isConversationViewed(raw.relatedUserId)) {
              notificationsApi.markAsRead(raw.id).catch(() => {});
              return;
            }

            const minimal: Notification = {
              id: raw.id,
              type: raw.type,
              content: raw.content,
              is_read: raw.isRead ?? false,
              created_at: raw.createdAt,
              related_user_id: raw.relatedUserId,
              related_item_id: raw.relatedItemId,
            };

            setNotifications(prev => [minimal, ...prev]);
            setUnreadCount(prev => prev + 1);

            try {
              const full = await notificationsApi.getNotifications();
              if (full.success && full.data?.notifications) {
                const enriched = full.data.notifications.find(
                  (n: Notification) => n.id === raw.id
                );
                if (enriched) {
                  setNotifications(prev =>
                    prev.map(n => (n.id === raw.id ? enriched : n))
                  );
                  showToast(enriched);
                  return;
                }
              }
            } catch {
              // fallback
            }

            showToast(minimal);
          }
        )
        .subscribe((status: string) => {
          console.log('🔔 Notification channel status:', status);
        });
    };

    import('@/lib/supabase')
      .then(({ supabase }) => {
        if (cancelled) return;
        subscribe(supabase);
      })
      .catch(() => {
        console.warn('Supabase not available, real-time notifications disabled for local testing');
      });

    return () => {
      cancelled = true;
      if (channel) channel.unsubscribe();
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
