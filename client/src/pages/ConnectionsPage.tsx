import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import OnlineIndicator from '../components/OnlineIndicator.tsx';
import { Check, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../config';

const ConnectionsPage = () => {
    const [activeTab, setActiveTab] = useState('connections');
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { getUserStatus } = useOnlinePresence();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [requestsRes, friendsRes] = await Promise.all([
                api.get('/friends/requests'),
                api.get('/friends')
            ]);
            setRequests(requestsRes.data);
            setFriends(friendsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespondRequest = async (id: string, status: string) => {
        try {
            await api.post(`/friends/request/${id}/respond`, { status });
            setRequests(requests.filter(req => req.id !== id));
            if (status === 'accepted') {
                // Refresh friends list if accepted
                const friendsRes = await api.get('/friends');
                setFriends(friendsRes.data);
            }
        } catch (err) {
            console.error(err);
        }
    };



    const tabs = [
        { id: 'connections', label: 'Connections', count: friends.length },
        { id: 'pending', label: 'Pending', count: requests.length }
    ];

    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ width: '100%', maxWidth: '1000px' }} className="page-enter">
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Connections</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Manage your network and discover new connections</p>

            <div className="stats-grid">
                {tabs.map(tab => (
                    <div key={tab.id} className="stat-item">
                        <span className="stat-value">{tab.count}</span>
                        <span className="stat-label">{tab.label}</span>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 20px',
                                background: 'none',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {activeTab === 'pending' ? (
                        requests.length > 0 ? (
                            requests.map(req => (
                                <div key={req.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        onClick={() => navigate(`/profile/${req.fromUser.username}`)}
                                    >
                                        <div className="avatar" style={{ overflow: 'visible', position: 'relative' }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                <img src={getImageUrl(req.fromUser.profilePicture) || `https://ui-avatars.com/api/?name=${req.fromUser.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            </div>
                                            <OnlineIndicator
                                                isOnline={getUserStatus(req.fromUser.id).isOnline}
                                                lastSeen={getUserStatus(req.fromUser.id).lastSeen}
                                                size="medium"
                                                position="bottom-right"
                                            />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>{req.fromUser.name}</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>@{req.fromUser.username}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleRespondRequest(req.id, 'accepted')}
                                            className="btn-create-post"
                                            style={{ width: '40px', height: '40px', margin: 0, padding: 0 }}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRespondRequest(req.id, 'rejected')}
                                            style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer' }}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No pending requests.
                            </div>
                        )
                    ) : (
                        friends.length > 0 ? (
                            friends.map(friend => (
                                <div key={friend.id} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                        onClick={() => navigate(`/profile/${friend.username}`)}
                                    >
                                        <div className="avatar" style={{ overflow: 'visible', position: 'relative' }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                <img src={getImageUrl(friend.profilePicture) || `https://ui-avatars.com/api/?name=${friend.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            </div>
                                            <OnlineIndicator
                                                isOnline={getUserStatus(friend.id).isOnline}
                                                lastSeen={getUserStatus(friend.id).lastSeen}
                                                size="medium"
                                                position="bottom-right"
                                            />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>{friend.name}</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>@{friend.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/messages', { state: { user: friend } })}
                                        className="btn-create-post"
                                        style={{ width: 'auto', padding: '8px 16px', margin: 0, height: 'auto', fontSize: '13px' }}
                                    >
                                        <MessageSquare size={16} /> Message
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No connections yet. Go to <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/discover')}>Discover</span> to find people!
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectionsPage;
