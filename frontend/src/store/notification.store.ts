import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationState {
  unreadCount: number
  recentNotifications: Notification[]
  setUnreadCount: (count: number) => void
  incrementUnread: () => void
  addNotification: (notification: Notification) => void
  markAllReadLocally: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentNotifications: [],

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),

  addNotification: (notification) =>
    set((s) => ({
      recentNotifications: [notification, ...s.recentNotifications].slice(0, 5),
    })),

  markAllReadLocally: () =>
    set((s) => ({
      unreadCount: 0,
      recentNotifications: s.recentNotifications.map((n) => ({ ...n, is_read: true })),
    })),
}))
