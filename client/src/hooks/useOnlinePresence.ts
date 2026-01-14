import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';

interface UserPresence {
    [userId: string]: {
        isOnline: boolean;
        lastSeen?: Date;
    };
}

export const useOnlinePresence = () => {
    const [userPresence, setUserPresence] = useState<UserPresence>({});
    const socket = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        if (!socket) return;

        const handleUserStatus = ({ userId, isOnline, lastSeen }: any) => {
            setUserPresence(prev => ({
                ...prev,
                [userId]: {
                    isOnline,
                    lastSeen: lastSeen ? new Date(lastSeen) : undefined
                }
            }));
        };

        const handleInitialOnlineUsers = (users: any[]) => {
            const presenceMap: UserPresence = {};
            users.forEach(user => {
                presenceMap[user.id] = {
                    isOnline: user.isOnline,
                    lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined
                };
            });
            setUserPresence(prev => ({ ...prev, ...presenceMap }));
        };

        socket.on('userStatus', handleUserStatus);
        socket.on('initialOnlineUsers', handleInitialOnlineUsers);

        return () => {
            socket.off('userStatus', handleUserStatus);
            socket.off('initialOnlineUsers', handleInitialOnlineUsers);
        };
    }, [socket]);

    const getUserStatus = (userId: string) => {
        // Always show the current user as online
        if (user?.id === userId) {
            return { isOnline: true, lastSeen: undefined };
        }
        return userPresence[userId] || { isOnline: false, lastSeen: undefined };
    };

    return { userPresence, getUserStatus };
};
