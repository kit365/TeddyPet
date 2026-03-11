import { create } from 'zustand';

export interface NotificationDTO {
    id: string;
    title: string;
    message: string;
    type: string;
    targetUrl: string;
    timestamp: string;
    isRead?: boolean;
}

interface NotificationState {
    notifications: NotificationDTO[];
    unreadCount: number;
    addNotification: (notification: NotificationDTO) => void;
    setNotifications: (notifications: NotificationDTO[]) => void;
    markAllAsRead: () => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;
    setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    addNotification: (notification) => set((state) => {
        // Prevent duplicates by ID
        if (state.notifications.some(n => n.id === notification.id)) {
            return state;
        }
        return {
            notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
            unreadCount: state.unreadCount + 1
        };
    }),
    setNotifications: (notifications) => set({
        notifications: notifications.slice(0, 50),
        unreadCount: notifications.filter(n => !n.isRead).length
    }),
    setUnreadCount: (count) => set({ unreadCount: count }),
    markAllAsRead: async () => {
        try {
            const { notificationApi } = await import('../api/notification.api');
            await notificationApi.markAllAsRead();
            set((state) => ({
                unreadCount: 0,
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            }));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    },
    markAsRead: async (id) => {
        try {
            const { notificationApi } = await import('../api/notification.api');
            await notificationApi.markAsRead(id);
            set((state) => {
                const notif = state.notifications.find(n => n.id === id);
                if (notif && !notif.isRead) {
                    return {
                        unreadCount: Math.max(0, state.unreadCount - 1),
                        notifications: state.notifications.map(n =>
                            n.id === id ? { ...n, isRead: true } : n
                        )
                    };
                }
                return state;
            });
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    },
    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
