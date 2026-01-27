import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../config';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import OnlineIndicator from '../components/OnlineIndicator.tsx';
import { Edit3, UserPlus, X, MessageCircle, Heart, MessageCircle as CommentIcon, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUser } = useAuth();
    const { getUserStatus } = useOnlinePresence();
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ name: '', bio: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [selectedProfilePic, setSelectedProfilePic] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

    // Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const toggleMenu = (postId: string) => {
        if (activeMenuId === postId) {
            setActiveMenuId(null);
        } else {
            setActiveMenuId(postId);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeMenuId && !(event.target as Element).closest('.post-menu-container')) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenuId]);

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [username, currentUser]);

    const fetchProfile = async () => {
        if (!username || username === 'undefined') {
            setLoading(false);
            setError('Invalid username');
            return;
        }

        try {
            setError(null);
            const res = await api.get(`/friends/profile/${username}`);
            setProfile(res.data);
            if (res.data.id === currentUser?.id) {
                setEditData({ name: res.data.name, bio: res.data.bio || '' });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            // Need a route for this or filter feed. 
            // For now, let's assume we have a route or just filter.
            // Better to add a route: GET /posts/user/:username
            const res = await api.get(`/posts/user/${username}`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('bio', editData.bio);
            if (selectedProfilePic) {
                formData.append('profilePicture', selectedProfilePic);
            }
            const res = await api.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(res.data);
            setProfile({ ...profile, ...res.data });
            setIsEditModalOpen(false);
            setSelectedProfilePic(null);
            setProfilePicPreview(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedProfilePic(file);
            setProfilePicPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveProfilePic = async () => {
        // If there's a local preview/selected file, just clear that first
        if (profilePicPreview || selectedProfilePic) {
            setSelectedProfilePic(null);
            setProfilePicPreview(null);
            return;
        }

        if (!profile.profilePicture) return;

        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        try {
            console.log('Attempting to remove profile picture...');
            const res = await api.delete('/auth/profile/picture');
            console.log('Profile picture removed successfully:', res.data);
            updateUser(res.data);
            setProfile({ ...profile, ...res.data });
            setSelectedProfilePic(null);
            setProfilePicPreview(null);
            // Modal stays open so user can continue editing name/bio
        } catch (err: any) {
            console.error('Error removing profile picture:', err);
            alert(`Failed to remove profile picture: ${err.response?.data?.error || err.message || 'Unknown error'}`);
        }
    };

    const handleFriendAction = async () => {
        if (!profile) return;
        try {
            if (profile.requestStatus === 'none') {
                await api.post('/friends/request', { toUserId: profile.id });
                setProfile({ ...profile, requestStatus: 'sent' });
            } else if (profile.requestStatus === 'received') {
                await api.post(`/friends/request/${profile.requestId}/respond`, { status: 'accepted' });
                setProfile({ ...profile, isFriend: true, requestStatus: 'none', _count: { ...profile._count, friends: profile._count.friends + 1 } });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(p => p.id !== postId));
            setActiveMenuId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete post');
        }
    };



    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-main)' }}>
            <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--primary)', borderRadius: '50%' }}></div>
            Loading profile...
        </div>
    );

    if (error || !profile) return (
        <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-main)' }}>
            <h2 style={{ marginBottom: '16px' }}>{error || 'User not found'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                We couldn't find the user you're looking for.
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">Back to Feed</button>
        </div>
    );

    const isOwnProfile = currentUser?.id === profile?.id;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }} className="page-enter">
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ height: '200px', background: 'linear-gradient(135deg, var(--primary), #a855f7)' }}></div>
                <div style={{ padding: '0 24px 24px' }}>
                    <div className="profile-header-container">
                        <div className="profile-avatar-wrapper">
                            <div className="avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--surface)', border: '4px solid var(--bg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '800', position: 'relative' }}>
                                {profile.profilePicture ? (
                                    <img src={getImageUrl(profile.profilePicture)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                ) : (
                                    profile.name[0]
                                )}
                                <OnlineIndicator
                                    isOnline={getUserStatus(profile.id).isOnline}
                                    lastSeen={getUserStatus(profile.id).lastSeen}
                                    size="large"
                                    position="bottom-right"
                                />
                            </div>
                        </div>
                        <div className="profile-actions-wrapper">
                            {isOwnProfile ? (
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="btn-secondary"
                                    style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    <Edit3 size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    {!profile.isFriend && (
                                        <button
                                            onClick={handleFriendAction}
                                            className="btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            disabled={profile.requestStatus === 'sent'}
                                        >
                                            <UserPlus size={18} />
                                            {profile.requestStatus === 'sent' ? 'Request Sent' : profile.requestStatus === 'received' ? 'Accept Request' : 'Add Friend'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate('/messages', { state: { user: profile } })}
                                        className="btn-secondary"
                                        style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        <MessageCircle size={18} />
                                        Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{profile.name}</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>@{profile.username}</p>

                    <p style={{ marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>{profile.bio || 'No bio yet'}</p>

                    <div style={{ display: 'flex', gap: '40px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                        <div>
                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{profile._count?.friends || profile.friends?.length || 0}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>Friends</span>
                        </div>
                        <div>
                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{profile._count?.posts || posts.length || 0}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>Posts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {posts.map((post) => (
                    <div key={post.id} className="card" style={{ padding: '12px', position: 'relative' }}>
                        {isOwnProfile && (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }} className="post-menu-container">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMenu(post.id); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.8)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        color: '#333'
                                    }}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                                {activeMenuId === post.id && (
                                    <div style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        marginTop: '4px',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-md)',
                                        zIndex: 50,
                                        minWidth: '140px',
                                        overflow: 'hidden'
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: '#ef4444',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            Delete Post
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {post.image && <img src={getImageUrl(post.image)} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} />}
                        <p style={{ fontSize: '14px', marginBottom: '8px' }}>{post.content}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} /> {post.likes?.length || 0}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CommentIcon size={14} /> {post.comments?.length || 0}</span>
                                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>
                                    {Math.max(0, 24 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)))}h left
                                </span>
                            </div>
                            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                    </div>
                ))}
            </div>

            {posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    No posts to show.
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="card modal-animate" style={{ width: '100%', maxWidth: '450px', padding: '32px', position: 'relative' }}>
                        <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '24px', color: 'white' }}>Edit Profile</h2>
                        <form onSubmit={handleUpdateProfile}>
                            {/* Profile Picture Upload */}
                            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: 'white' }}>Profile Picture</label>
                                <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                                    <div className="avatar" style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        margin: '0 auto',
                                        overflow: 'hidden',
                                        border: '3px solid var(--primary)',
                                        transition: 'transform 0.2s',
                                        position: 'relative'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <img
                                            src={profilePicPreview || getImageUrl(profile.profilePicture) || `https://ui-avatars.com/api/?name=${profile.name}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt="Profile"
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            padding: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600'
                                        }}>
                                            Change Photo
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleProfilePicChange}
                                    />
                                </label>
                                {selectedProfilePic && (
                                    <p style={{ marginTop: '8px', fontSize: '13px', color: 'white' }}>
                                        New photo selected ✓
                                    </p>
                                )}
                                {(profile.profilePicture || profilePicPreview) && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveProfilePic}
                                        style={{
                                            marginTop: '12px',
                                            padding: '8px 16px',
                                            background: 'transparent',
                                            color: '#ef4444',
                                            border: '1px solid #ef4444',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#ef4444';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                    >
                                        {profilePicPreview ? 'Cancel Selection' : 'Remove Photo'}
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'white' }}>Name</label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'white' }}>Bio</label>
                                <textarea
                                    value={editData.bio}
                                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '100px', resize: 'none', outline: 'none' }}
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', color: 'white' }} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
