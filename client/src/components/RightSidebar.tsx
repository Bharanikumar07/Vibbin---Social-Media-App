import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../hooks/useSocket.ts';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import OnlineIndicator from './OnlineIndicator.tsx';

const RightSidebar = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const navigate = useNavigate();
    const socket = useSocket();
    const { getUserStatus } = useOnlinePresence();

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleStatus = (data: any) => {
                setConversations(prev => prev.map(c =>
                    c.id === data.userId ? { ...c, isOnline: data.isOnline } : c
                ));
            };
            socket.on('userStatus', handleStatus);
            return () => {
                socket.off('userStatus', handleStatus);
            };
        }
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data.slice(0, 5));
        } catch (err) {
            console.error(err);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    return (
        <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discover</p>
                </div>
                <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Grow your network</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Find people you may know and stay connected.</p>
                    <button
                        onClick={() => navigate('/discover')}
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                    >
                        Explore People
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Messages</p>
                </div>
                <div style={{ padding: '16px' }}>
                    {conversations.length > 0 ? (
                        conversations.map((chat, i) => (
                            <div
                                key={i}
                                onClick={() => navigate('/messages')}
                                style={{ display: 'flex', gap: '12px', marginBottom: '16px', cursor: 'pointer', position: 'relative' }}
                            >
                                <div className="avatar" style={{ width: '36px', height: '36px', overflow: 'hidden', position: 'relative' }}>
                                    <img src={getImageUrl(chat.profilePicture) || `https://ui-avatars.com/api/?name=${chat.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    <OnlineIndicator
                                        isOnline={getUserStatus(chat.id).isOnline}
                                        lastSeen={getUserStatus(chat.id).lastSeen}
                                        size="small"
                                        position="bottom-right"
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: '13px', fontWeight: '600' }}>{chat.name}</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                            {chat.lastMessage && formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false })}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {chat.lastMessage?.image ? '📷 Photo' : (chat.lastMessage?.content || 'Started a conversation')}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>No messages yet.</p>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
