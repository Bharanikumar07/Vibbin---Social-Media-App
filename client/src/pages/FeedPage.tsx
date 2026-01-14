import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getImageUrl } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket.ts';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import RightSidebar from '../components/RightSidebar.tsx';
import OnlineIndicator from '../components/OnlineIndicator.tsx';

import StoryViewer from '../components/StoryViewer';

const FeedPage = () => {
    const { user: currentUser } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const { getUserStatus } = useOnlinePresence();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploadingStory, setIsUploadingStory] = useState(false);

    // Story Viewer State
    const [isStoryOpen, setIsStoryOpen] = useState(false);
    const [initialStoryIndex, setInitialStoryIndex] = useState(0);

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

    // ... (keep useEffects and fetch functions same, ensure fetchStories gets new fields) ...

    useEffect(() => {
        fetchFeed();
        fetchStories();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNewPost = (post: any) => {
                setPosts((prev) => {
                    if (prev.some(p => p.id === post.id)) return prev;
                    return [post, ...prev];
                });
            };
            const handlePostUpdate = (update: any) => {
                setPosts((prev) => prev.map(post => {
                    if (post.id === update.postId) {
                        if (update.type === 'like') {
                            return { ...post, likes: [...(post.likes || []), { userId: update.userId }] };
                        }
                        if (update.type === 'unlike') {
                            return { ...post, likes: (post.likes || []).filter((l: any) => l.userId !== update.userId) };
                        }
                        if (update.type === 'comment') {
                            return { ...post, comments: [...(post.comments || []), update.comment] };
                        }
                    }
                    return post;
                }));
            };

            // Listen for story updates in feed preview too (optional but nice)
            const handleStoryUpdate = (update: any) => {
                setStories((prev) => prev.map(s => {
                    if (s.id === update.storyId) {
                        // Minimal update for preview if needed, mostly handled by viewer
                        // For now just keep it in sync if likes count was shown in preview (it's not)
                        return s;
                    }
                    return s;
                }));
            };

            const handlePostDelete = ({ postId }: { postId: string }) => {
                setPosts(prev => prev.filter(p => p.id !== postId));
                if (activeMenuId === postId) setActiveMenuId(null);
            };

            socket.on('newPost', handleNewPost);
            socket.on('postUpdate', handlePostUpdate);
            socket.on('story_updated', handleStoryUpdate);
            socket.on('postDeleted', handlePostDelete);

            return () => {
                socket.off('newPost', handleNewPost);
                socket.off('postUpdate', handlePostUpdate);
                socket.off('story_updated', handleStoryUpdate);
                socket.off('postDeleted', handlePostDelete);
            };
        }
    }, [socket, activeMenuId]);

    const fetchFeed = async () => {
        try {
            const res = await api.get('/posts/feed');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStories = async () => {
        try {
            const res = await api.get('/stories');
            setStories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !selectedImage) return;

        const formData = new FormData();
        formData.append('content', content);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        try {
            const res = await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPosts([res.data, ...posts]);
            setContent('');
            setSelectedImage(null);
            setImagePreview(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        setIsUploadingStory(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('media', file);

        try {
            const res = await api.post('/stories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStories([res.data, ...stories]);
        } catch (err) {
            console.error(err);
            alert('Failed to upload story');
        } finally {
            setIsUploadingStory(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            await api.post(`/posts/${postId}/like`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async (postId: string, content: string) => {
        if (!content.trim()) return;
        try {
            await api.post(`/posts/${postId}/comment`, { content });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            setActiveMenuId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete post');
        }
    };

    // Open Viewer Logic
    const openStoryViewer = (index: number) => {
        setInitialStoryIndex(index);
        setIsStoryOpen(true);
        // Mark as viewed immediately for local feedback
        const story = stories[index];
        if (story) {
            api.post(`/stories/${story.id}/view`).catch(console.error);
            setStories(prev => prev.map(s => {
                if (s.id === story.id) {
                    const alreadyViewed = (s.views || []).some((v: any) => v.userId === currentUser.id);
                    if (!alreadyViewed) {
                        return { ...s, views: [...(s.views || []), { userId: currentUser.id, user: currentUser }] };
                    }
                }
                return s;
            }));
        }
    };

    // Local definition removed, using imported one.
    // const getImageUrl = ...

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Loading...</div>;

    return (
        <div className="feed-layout page-enter">
            <div className="feed-main">
                {/* Stories Section */}
                <div className="stories-container">
                    <label className="story-item" style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <input
                            type="file"
                            hidden
                            accept="image/*,video/*"
                            onChange={handleCreateStory}
                            disabled={isUploadingStory}
                        />
                        <div className="story-circle viewed">
                            <img src={getImageUrl(currentUser.profilePicture) || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt="Your profile" />
                            <div className="story-plus-badge">
                                {isUploadingStory ? (
                                    <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                ) : (
                                    <Plus size={14} />
                                )}
                            </div>
                        </div>
                        <p style={{ fontSize: '11px', marginTop: '6px', fontWeight: '500', color: 'var(--text-main)', opacity: 0.8 }}>Your Story</p>
                    </label>

                    {stories.map((story, index) => (
                        <div key={story.id} className="story-item" style={{ textAlign: 'center' }} onClick={() => openStoryViewer(index)}>
                            <div className={`story-circle ${(story.views || []).some((v: any) => v.userId === currentUser?.id) ? 'viewed' : 'unviewed'}`}>
                                <img src={getImageUrl(story.media)} alt="story" />
                                <div className="story-author-avatar">
                                    <img src={getImageUrl(story.author.profilePicture) || `https://ui-avatars.com/api/?name=${story.author.name}`} alt="" />
                                </div>
                            </div>
                            <p style={{ fontSize: '11px', marginTop: '6px', fontWeight: '500', color: 'var(--text-main)' }}>{story.author.username}</p>
                            <span className="story-time-badge">
                                {Math.max(0, 24 - Math.floor((Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60)))}h left
                            </span>
                        </div>
                    ))}
                </div>

                {/* Create Post Card */}
                <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                    <form onSubmit={handleCreatePost}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', background: '#f5f3ff' }}>
                                {currentUser?.profilePicture ? (
                                    <img src={getImageUrl(currentUser.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    currentUser?.name?.[0] || '?'
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What's vibbin today?"
                                    style={{ width: '100%', border: 'none', resize: 'none', height: '80px', fontSize: '15px', padding: '8px 0', outline: 'none' }}
                                />
                                {imagePreview && (
                                    <div style={{ position: 'relative', marginTop: '12px', borderRadius: '12px', overflow: 'hidden' }}>
                                        <img src={imagePreview} style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} alt="preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', background: 'transparent', fontSize: '14px', cursor: 'pointer' }}>
                                <ImageIcon size={20} />
                                <span style={{ marginRight: '8px' }}>Media</span>
                                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                            </label>
                            <button type="submit" className="btn-create-post" style={{ width: 'auto', margin: 0, padding: '8px 24px' }}>Post</button>
                        </div>
                    </form>
                </div>

                {/* Posts Feed */}
                <AnimatePresence>
                    {posts.map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card post-card"
                        >
                            <div className="post-header">
                                <div className="avatar" style={{ position: 'relative' }}>
                                    <img src={getImageUrl(post.author.profilePicture) || `https://ui-avatars.com/api/?name=${post.author.name}`} className="avatar-img" />
                                    <OnlineIndicator
                                        isOnline={getUserStatus(post.author.id).isOnline}
                                        lastSeen={getUserStatus(post.author.id).lastSeen}
                                        size="small"
                                        position="bottom-right"
                                    />
                                </div>
                                <div style={{ marginLeft: '12px' }}>
                                    <p className="post-author">{post.author.name}</p>
                                    <p className="post-meta">
                                        @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt))} ago
                                        <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '11px', fontWeight: '600' }}>
                                            (Expires in {Math.max(0, 24 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)))}h)
                                        </span>
                                    </p>
                                </div>
                                <div style={{ marginLeft: 'auto', position: 'relative' }} className="post-menu-container">
                                    <button
                                        onClick={() => toggleMenu(post.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {activeMenuId === post.id && (
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '100%',
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            boxShadow: 'var(--shadow-md)',
                                            zIndex: 50,
                                            minWidth: '160px',
                                            overflow: 'hidden'
                                        }}>
                                            {(currentUser?.id === post.author.id || String(currentUser?.id) === String(post.author.id)) ? (
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        color: '#ef4444',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    className="menu-item-delete"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete Post
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { alert('Reported'); setActiveMenuId(null); }}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        color: 'var(--text-main)',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Report Post
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="post-content">
                                <p>{post.content}</p>
                            </div>

                            {post.image && <img src={getImageUrl(post.image)} className="post-image" alt="content" />}

                            <div className="post-actions">
                                <button className={`action-btn ${(post.likes || []).some((l: any) => l.userId === currentUser?.id) ? 'liked' : ''}`} onClick={() => handleLike(post.id)}>
                                    <Heart
                                        size={20}
                                        className={(post.likes || []).some((l: any) => l.userId === currentUser?.id) ? "animate-pop" : ""}
                                        fill={(post.likes || []).some((l: any) => l.userId === currentUser?.id) ? "currentColor" : "none"}
                                    />
                                    <span>{(post.likes || []).length}</span>
                                </button>
                                <button className="action-btn">
                                    <MessageCircle size={20} />
                                    <span>{(post.comments || []).length}</span>
                                </button>
                                <button className="action-btn">
                                    <Share2 size={20} />
                                    <span>0</span>
                                </button>
                            </div>

                            {/* Comments Section */}
                            <div className="comments-section" style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                {(post.comments || []).map((comment: any) => (
                                    <div key={comment.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <div className="avatar" style={{ width: '24px', height: '24px' }}>
                                            <img src={getImageUrl(comment.user.profilePicture) || `https://ui-avatars.com/api/?name=${comment.user.name}`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                        </div>
                                        <div className="comment-bubble">
                                            <span style={{ fontWeight: '700', marginRight: '6px' }}>{comment.user.username}</span>
                                            {comment.content}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleComment(post.id, (e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--border)', outline: 'none', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <RightSidebar />

            {/* Render Story Viewer */}
            {isStoryOpen && (
                <StoryViewer
                    stories={stories}
                    initialStoryIndex={initialStoryIndex}
                    onClose={() => setIsStoryOpen(false)}
                />
            )}
        </div>
    );
};

export default FeedPage;


