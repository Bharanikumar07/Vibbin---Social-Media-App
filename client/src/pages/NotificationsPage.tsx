import { useState } from 'react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Bell, UserPlus, Heart, MessageCircle, CheckCircle, MessageSquare, Check, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage = () => {
    const { notifications, markAllAsRead, markAsRead, fetchNotifications } = useNotifications();
    const [actioningId, setActioningId] = useState<string | null>(null);


    const handleFriendRequest = async (notifId: string, requestId: string, status: 'accepted' | 'rejected') => {
        setActioningId(notifId);
        try {
            await api.post(`/friends/request/${requestId}/respond`, { status });
            // Delete the notification from DB
            await api.delete(`/notifications/${notifId}`);
            // Refresh to update UI and badges
            fetchNotifications();
            if (status === 'accepted') {
                // Optionally show a success toast or notification
            }
        } catch (err: any) {
            console.error('Error handling friend request:', err);
            // Check if it's a 404 (request already handled) or 500 (server error)
            if (err.response?.status === 404) {
                // Request was already handled, just remove the notification
                try {
                    await api.delete(`/notifications/${notifId}`);
                    fetchNotifications();
                } catch (deleteErr) {
                    console.error('Error deleting notification:', deleteErr);
                }
            } else {
                alert(`Failed to respond to request: ${err.response?.data?.error || err.message || 'Unknown error'}`);
            }
        } finally {
            setActioningId(null);
        }
    };


    const renderContent = (n: any) => {
        if (!n.sender) return n.content;

        // If content already includes name, don't duplicate it in the bold part.
        // Usually content is like "John Doe liked your post"
        // We want: **John Doe** liked your post
        const nameInContent = n.content.includes(n.sender.name);
        const displayContent = nameInContent
            ? n.content.replace(n.sender.name, '').trim()
            : n.content;

        return (
            <>
                <span style={{ fontWeight: '800' }}>{n.sender.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}> (@{n.sender.username})</span>
                {" "}{displayContent}
            </>
        );
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'FRIEND_REQUEST':
            case 'friend_request': return <UserPlus size={20} color="#3b82f6" />;
            case 'FRIEND_ACCEPTED':
            case 'request_accepted': return <CheckCircle size={20} color="#10b981" />;
            case 'MESSAGE':
            case 'new_message': return <MessageSquare size={20} color="#f59e0b" />;
            case 'POST_LIKE':
            case 'post_like': return <Heart size={20} color="#ef4444" />;
            case 'COMMENT':
            case 'post_comment': return <MessageCircle size={20} color="#8b5cf6" />;
            case 'STORY_LIKE':
            case 'story_like': return <Heart size={20} color="#ec4899" />;
            case 'STORY_COMMENT':
            case 'story_comment': return <MessageCircle size={20} color="#a855f7" />;
            default: return <Bell size={20} />;
        }
    };

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }} className="page-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Notifications</h1>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={markAllAsRead}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => !n.read && markAsRead(n.id)}
                            style={{
                                display: 'flex',
                                gap: '16px',
                                padding: '20px',
                                background: n.read ? 'var(--card-bg)' : 'var(--bg)',
                                borderRadius: '16px',
                                border: n.read ? '1px solid var(--border)' : '1px solid var(--primary)',
                                alignItems: 'flex-start',
                                transition: 'all 0.2s',
                                boxShadow: n.read ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.1)',
                                cursor: !n.read ? 'pointer' : 'default',
                                position: 'relative'
                            }}
                        >
                            <div className="avatar" style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden' }}>
                                {n.sender ? (
                                    <img src={getImageUrl(n.sender.profilePicture) || `https://ui-avatars.com/api/?name=${n.sender.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Bell size={20} color="var(--text-muted)" />
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {getIcon(n.type)}
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: n.read ? '400' : '600', color: 'var(--text-main)', lineHeight: '1.4' }}>
                                    {renderContent(n)}
                                </p>

                                {(n.type === 'friend_request' || n.type === 'FRIEND_REQUEST') && n.targetId && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); n.targetId && handleFriendRequest(n.id, n.targetId, 'accepted'); }}
                                            disabled={actioningId === n.id}
                                            className="btn-create-post"
                                            style={{ margin: 0, padding: '8px 20px', fontSize: '14px', width: 'auto', height: 'auto' }}
                                        >
                                            <Check size={16} /> Accept
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); n.targetId && handleFriendRequest(n.id, n.targetId, 'rejected'); }}
                                            disabled={actioningId === n.id}
                                            style={{ padding: '8px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!n.read && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                    style={{
                                        position: 'absolute',
                                        right: '20px',
                                        top: '20px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '4px 8px',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    New
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Bell size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No notifications yet stay tuned!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
