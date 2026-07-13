import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../types';

const STORAGE_KEY = 'app_notifications_data';

// Helper for initial dummy data if none exists
const getInitialNotifications = (): Notification[] => {
    return [
        {
            id: 'n1',
            title: 'Bienvenido al Centro de Notificaciones',
            message: 'Aquí podrás recibir y enviar mensajes entre sucursales.',
            createdAt: new Date().toISOString(),
            sourceStoreId: 'system',
            targetStoreId: 'all',
            priority: 'normal',
            status: 'unread',
            type: 'system'
        }
    ];
};

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return getInitialNotifications();
            }
        }
        return getInitialNotifications();
    });

    useEffect(() => {
        const handleSync = () => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    setNotifications(JSON.parse(saved));
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        };

        window.addEventListener('storage', handleSync);
        window.addEventListener('notifications_updated', handleSync);

        return () => {
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('notifications_updated', handleSync);
        };
    }, []);

    // Helper to save and dispatch
    const saveAndSync = (newNotifications: Notification[]) => {
        setNotifications(newNotifications);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
        window.dispatchEvent(new Event('notifications_updated'));
    };

    const addNotification = useCallback((data: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
        const newNotification: Notification = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'unread'
        };
        saveAndSync([newNotification, ...notifications]);
    }, [notifications]);

    const markAsRead = useCallback((id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, status: 'read' as const } : n);
        saveAndSync(updated);
    }, [notifications]);

    const markAllAsRead = useCallback((storeId: string) => {
        const updated = notifications.map(n => 
            (n.targetStoreId === 'all' || n.targetStoreId === storeId) && n.status === 'unread'
                ? { ...n, status: 'read' as const }
                : n
        );
        saveAndSync(updated);
    }, [notifications]);

    const deleteNotification = useCallback((id: string) => {
        const updated = notifications.filter(n => n.id !== id);
        saveAndSync(updated);
    }, [notifications]);

    const getUnreadCount = useCallback((storeId: string) => {
        return notifications.filter(n => 
            (n.targetStoreId === storeId || n.targetStoreId === 'all') && n.status === 'unread'
        ).length;
    }, [notifications]);

    return {
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getUnreadCount
    };
};
