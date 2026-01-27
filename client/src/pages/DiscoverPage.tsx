import React, { useState } from 'react';
import api from '../utils/api';
import { Search, UserPlus, Check, User, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../config';
import { useAuth } from '../context/AuthContext';

const DiscoverPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.get(`/friends/search?q=${query}`);
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [requestLoading, setRequestLoading] = useState<string | null>(null);

    const handleSendRequest = async (toUserId: string) => {
        if (requestLoading) return;
        setRequestLoading(toUserId);
        try {
            await api.post('/friends/request', { toUserId });
            setResults(results.map(u => u.id === toUserId ? { ...u, pendingRequest: true, requestSent: true } : u));
        } catch (err: any) {
            console.error('Failed to send friend request:', err);
            const errorMessage = err.response?.data?.error || 'Failed to send request';
            alert(errorMessage); // Or a toast notification if available
        } finally {
            setRequestLoading(null);
        }
    };



    return (
        <div style={{ width: '100%', maxWidth: '1000px' }} className="page-enter">
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Discover People</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Connect with amazing people and grow your network</p>

            <div className="card" style={{ padding: '20px', marginBottom: '32px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search people by name, username..."
                            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                        />
                    </div>
                    <button type="submit" className="btn-create-post" style={{ width: 'auto', margin: 0, padding: '0 24px' }}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
                {results.map(user => (
                    <div key={user.id} className="card" style={{ padding: '24px', textAlign: 'center' }}>
                        <div className="avatar" style={{ width: '80px', height: '80px', margin: '0 auto 16px', overflow: 'hidden' }}>
                            <img src={getImageUrl(user.profilePicture) || `https://ui-avatars.com/api/?name=${user.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>
                        <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{user.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>@{user.username}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '20px', minHeight: '40px' }}>
                            {user.bio || 'Building the future of social.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {user.isFriend ? (
                                <button
                                    onClick={() => navigate('/messages')}
                                    className="btn-create-post"
                                    style={{ margin: 0, flex: 1 }}
                                >
                                    <MessageSquare size={18} /> Message
                                </button>
                            ) : user.pendingRequest ? (
                                <button
                                    disabled
                                    className="btn-create-post"
                                    style={{ margin: 0, flex: 1, opacity: 0.7, background: '#f1f5f9', color: 'var(--text-muted)', boxShadow: 'none' }}
                                >
                                    <Clock size={18} /> {user.requestSent ? 'Request Sent' : 'Pending Action'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSendRequest(user.id)}
                                    className="btn-create-post"
                                    style={{ margin: 0, flex: 1, opacity: requestLoading === user.id ? 0.7 : 1 }}
                                    disabled={requestLoading === user.id}
                                >
                                    <UserPlus size={18} /> {requestLoading === user.id ? 'Sending...' : 'Add Friend'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {results.length === 0 && !loading && query && (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
                    No people found matching your search.
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;
