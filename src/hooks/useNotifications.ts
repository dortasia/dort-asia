"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'billing' | 'subscription' | 'security' | 'app';
  unread: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return "Recent";
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.notifications || [];
        const formatted: NotificationItem[] = rawList.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: formatRelativeTime(n.created_at),
          type: n.type || 'system',
          unread: !n.is_read,
          actionUrl: n.action_url,
          metadata: n.metadata,
          createdAt: n.created_at,
        }));

        setNotifications(formatted);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[useNotifications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time Supabase subscription
  useEffect(() => {
    let isMounted = true;
    let channel: any = null;
    const supabase = createClient();

    fetchNotifications();

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prevent race conditions if unmounted during await (React Strict Mode)
      if (!isMounted) return;

      const channelName = `user-notifications-${user.id}`;
      console.log(`[Notifications] Current authenticated user.id: ${user.id}`);

      // Clean up any lingering channel with this name to avoid double-subscriptions
      supabase.getChannels().forEach((c: any) => {
        if (c.topic === `realtime:${channelName}` || c.topic === channelName) {
          console.log(`[Notifications] Removing lingering channel:`, c.topic);
          supabase.removeChannel(c);
        }
      });

      console.log(`[Notifications] Creating channel: ${channelName}`);
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            console.log(`[Notifications] Realtime event:`, payload);
            if (payload.eventType === 'INSERT') {
              console.log('[Notifications] INSERT event received');
            } else if (payload.eventType === 'UPDATE') {
              console.log('[Notifications] UPDATE event received');
            } else if (payload.eventType === 'DELETE') {
              console.log('[Notifications] DELETE event received');
            }
            
            if (isMounted) {
              if (payload.eventType === 'INSERT') {
                const newNotif = payload.new as any;
                setNotifications(prev => {
                  if (prev.some(n => n.id === newNotif.id)) return prev;
                  const formatted: NotificationItem = {
                    id: newNotif.id,
                    title: newNotif.title,
                    message: newNotif.message,
                    time: formatRelativeTime(newNotif.created_at || new Date().toISOString()),
                    type: newNotif.type || 'system',
                    unread: !newNotif.is_read,
                    actionUrl: newNotif.action_url,
                    metadata: newNotif.metadata,
                    createdAt: newNotif.created_at || new Date().toISOString(),
                  };
                  return [formatted, ...prev];
                });
                if (!payload.new.is_read) {
                  setUnreadCount(prev => prev + 1);
                }
              } else if (payload.eventType === 'UPDATE') {
                const updatedNotif = payload.new as any;
                setNotifications(prev => prev.map(n => 
                  n.id === updatedNotif.id ? {
                    ...n,
                    unread: !updatedNotif.is_read,
                  } : n
                ));
                // Background sync
                fetchNotifications();
              } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old.id;
                setNotifications(prev => prev.filter(n => n.id !== deletedId));
                // Background sync
                fetchNotifications();
              }
            }
          }
        );
      
      channel.subscribe((status: string, err?: any) => {
        console.log(`[Notifications] Realtime status:`, status);
        if (err) {
          console.error(`[Notifications] Realtime error:`, err);
        }
      });
    }

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const dismissNotification = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', id }),
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refresh: fetchNotifications,
  };
}
