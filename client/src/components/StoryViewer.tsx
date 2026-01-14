import React, { useState, useEffect, useRef } from 'react';
import { Heart, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

interface StoryViewerProps {
    stories: any[];
    initialStoryIndex: number;
    onClose: () => void;
}

const StoryViewer = ({ stories, initialStoryIndex, onClose }: StoryViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [headerStories, setHeaderStories] = useState([...stories]);
    const currentStory = headerStories[currentIndex];
    const [isClosing, setIsClosing] = useState(false);

    // Safety check - if stories array is empty or index invalid
    if (!currentStory) {
        onClose();
        return null;
    }

    const { user: currentUser } = useAuth();
    const socket = useSocket();
    const [comment, setComment] = useState('');
    const [progress, setProgress] = useState(0);
    const startTimeRef = useRef(Date.now());
    const animationFrameRef = useRef<number | undefined>(undefined);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 250); // Match animation duration
    };

    // Socket listener for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleStoryUpdate = (update: any) => {
            setHeaderStories(prevStories => prevStories.map((s) => {
                if (s.id !== update.storyId) return s;

                if (update.type === 'like') {
                    return { ...s, likes: [...(s.likes || []), update.like] };
                }
                if (update.type === 'unlike') {
                    return { ...s, likes: (s.likes || []).filter((l: any) => l.userId !== update.userId) };
                }
                if (update.type === 'comment') {
                    return { ...s, comments: [...(s.comments || []), update.comment] };
                }
                return s;
            }));
        };

        socket.on('story_updated', handleStoryUpdate);
        return () => {
            socket.off('story_updated', handleStoryUpdate);
        };
    }, [socket]);

    // Auto-advance progress bar
    useEffect(() => {
        setProgress(0);
        startTimeRef.current = Date.now();
        const duration = 5000; // 5 seconds per story

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress < 100) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                handleNext();
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [currentIndex]);


    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal click closing issues if any
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleLike = async () => {
        if (!currentStory) return;
        try {
            await api.post(`/stories/${currentStory.id}/like`);
            // Optimistic update
            const alreadyLiked = (currentStory.likes || []).some((l: any) => l.userId === currentUser.id);
            setHeaderStories(prev => prev.map((s, i) => {
                if (i !== currentIndex) return s; // Keep as i !== currentIndex to only animate the *current* heart locally if desired, but for consistency lets update by ID or index. 
                // Actually, let's update by ID to be safe
                if (s.id !== currentStory.id) return s;

                if (alreadyLiked) {
                    return { ...s, likes: s.likes.filter((l: any) => l.userId !== currentUser.id) };
                } else {
                    return { ...s, likes: [...(s.likes || []), { userId: currentUser.id, user: currentUser }] };
                }
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !currentStory) return;

        try {
            await api.post(`/stories/${currentStory.id}/comment`, { content: comment });
            setComment('');
        } catch (err) {
            console.error(err);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`;
    };

    const isLiked = (currentStory.likes || []).some((l: any) => l.userId === currentUser.id);

    return (
        <div className={`story-viewer-overlay ${isClosing ? 'story-viewer-closing' : ''}`} onClick={handleClose}>
            <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="story-progress-bar">
                    {stories.map((_, idx) => (
                        <div key={idx} className="story-progress-segment">
                            <div
                                className="story-progress-fill"
                                style={{
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-viewer-header">
                    <img
                        src={getImageUrl(currentStory.author.profilePicture) || `https://ui-avatars.com/api/?name=${currentStory.author.name}`}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white' }}
                    />
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{currentStory.author.username}</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>{formatDistanceToNow(new Date(currentStory.createdAt))} ago</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button style={{ color: 'white' }}><MoreHorizontal size={20} /></button>
                        <button onClick={handleClose} style={{ color: 'white' }}>×</button>
                    </div>
                </div>

                {/* Navigation Zones */}
                <div
                    style={{ position: 'absolute', top: '60px', bottom: '100px', left: 0, width: '30%', zIndex: 5 }}
                    onClick={handlePrev}
                ></div>
                <div
                    style={{ position: 'absolute', top: '60px', bottom: '100px', right: 0, width: '30%', zIndex: 5 }}
                    onClick={handleNext}
                ></div>

                {/* Media */}
                <img src={getImageUrl(currentStory.media)} className="story-viewer-media" draggable="false" />

                {/* Footer / Interactions */}
                <div className="story-viewer-footer">
                    {/* View Count */}
                    <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                        {(currentStory.views || []).length} views
                    </div>

                    {/* Comments Preview (Last 2) */}
                    <div className="story-comments-preview" style={{ maxHeight: '60px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                        {(currentStory.comments || []).slice(-2).map((c: any) => (
                            <div key={c.id} style={{ fontSize: '13px', display: 'flex', gap: '6px' }}>
                                <span style={{ fontWeight: '700' }}>{c.user.username}</span>
                                <span style={{ opacity: 0.9 }}>{c.content}</span>
                            </div>
                        ))}
                    </div>

                    <div className="story-actions">
                        <form onSubmit={handleComment} style={{ flex: 1, display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Send a message..."
                                onFocus={() => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }} // Pause on type
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '20px',
                                    padding: '8px 12px',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            />
                            {comment && (
                                <button type="submit" style={{ color: 'white' }}>
                                    <Send size={20} />
                                </button>
                            )}
                        </form>

                        <button className="story-like-btn" onClick={handleLike}>
                            <Heart
                                size={28}
                                className={isLiked ? "animate-pop" : ""}
                                fill={isLiked ? "#ef4444" : "none"}
                                color={isLiked ? "#ef4444" : "white"}
                                strokeWidth={1.5}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryViewer;
