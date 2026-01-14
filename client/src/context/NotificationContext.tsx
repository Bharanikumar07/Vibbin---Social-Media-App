import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import { notificationSound } from '../utils/notificationSound';
import api from '../utils/api';

interface Notification {
    id: string;
    userId: string;
    type: string;
    content: string;
    read: boolean;
    createdAt: string;
    targetId?: string;
    sender?: {
        id: string;
        name: string;
        username: string;
        profilePicture: string | null;
    };
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    soundEnabled: boolean;
    showBellAnimation: boolean;
    toggleSound: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(notificationSound.isEnabled());
    const [showBellAnimation, setShowBellAnimation] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch notifications on mount
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    // Listen for real-time notifications
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewNotification = (notification: Notification) => {
            console.log('🔔 New notification received:', notification);

            // Add to notifications list
            setNotifications(prev => [notification, ...prev]);

            // Play sound if enabled
            if (soundEnabled) {
                notificationSound.play();
            }

            // Trigger bell animation
            triggerBellAnimation();
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [socket, user, soundEnabled]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const triggerBellAnimation = () => {
        setShowBellAnimation(true);
        setTimeout(() => setShowBellAnimation(false), 1000);
    };

    const toggleSound = async () => {
        const newValue = !soundEnabled;
        setSoundEnabled(newValue);
        notificationSound.setEnabled(newValue);

        // Save to database
        try {
            await api.put('/auth/profile', { notificationSound: newValue });
        } catch (error) {
            console.error('Failed to save sound preference:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                soundEnabled,
                showBellAnimation,
                toggleSound,
                markAsRead,
                markAllAsRead,
                fetchNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
