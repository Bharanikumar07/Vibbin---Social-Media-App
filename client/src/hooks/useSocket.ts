import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

export const useSocket = () => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (user && token) {
            const newSocket = io(API_URL);
            newSocket.emit('join', user.id);
            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, token]);

    return socket;
};
