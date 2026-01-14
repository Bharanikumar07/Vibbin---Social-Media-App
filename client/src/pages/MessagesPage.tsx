import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket.ts';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import OnlineIndicator from '../components/OnlineIndicator.tsx';
import { Send, Search, User, Image as ImageIcon, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getImageUrl } from '../config';

const MessagesPage = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const { getUserStatus } = useOnlinePresence();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [peerTyping, setPeerTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<any>(null);

    const location = useLocation();

    useEffect(() => {
        fetchConversations();
        if (location.state?.user) {
            setSelectedUser(location.state.user);
        }
    }, [location.state]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            markAsRead(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (socket) {
            const handleMessage = (message: any) => {
                if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
                    setMessages((prev) => [...prev, message]);
                    if (message.senderId === selectedUser.id) {
                        markAsRead(selectedUser.id);
                    }
                }
                fetchConversations();
            };

            const handleTyping = (data: any) => {
                if (selectedUser && data.userId === selectedUser.id) {
                    setPeerTyping(data.isTyping);
                }
            };

            const handleStatusChange = (data: any) => {
                setConversations(prev => prev.map(c => c.id === data.userId ? { ...c, isOnline: data.isOnline, lastSeen: data.lastSeen } : c));
                if (selectedUser?.id === data.userId) {
                    setSelectedUser((prev: any) => prev ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : null);
                }
            };

            socket.on('newMessage', handleMessage);
            socket.on('userTyping', handleTyping);
            socket.on('userStatus', handleStatusChange);

            return () => {
                socket.off('newMessage', handleMessage);
                socket.off('userTyping', handleTyping);
                socket.off('userStatus', handleStatusChange);
            };
        }
    }, [socket, selectedUser, user.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, peerTyping]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await api.get(`/messages/${userId}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const markAsRead = async (userId: string) => {
        try {
            await api.post(`/messages/read/${userId}`);
            setConversations(prev => prev.map(c => c.id === userId ? { ...c, lastMessage: c.lastMessage ? { ...c.lastMessage, isRead: true } : null } : c));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !selectedUser) return;

        const formData = new FormData();
        formData.append('receiverId', selectedUser.id);
        formData.append('content', newMessage);
        if (selectedImage) {
            formData.append('image', selectedImage);
        }

        try {
            await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            stopTyping();
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

    const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!isTyping && socket) {
            setIsTyping(true);
            socket.emit('typing', { receiverId: selectedUser.id, isTyping: true });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 3000);
    };

    const stopTyping = () => {
        if (isTyping && socket && selectedUser) {
            setIsTyping(false);
            socket.emit('typing', { receiverId: selectedUser.id, isTyping: false });
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };



    if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div className="page-enter" style={{ width: '100%', height: 'calc(100vh - 64px)', display: 'flex', background: 'var(--card-bg)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', alignSelf: 'stretch' }}>
            {/* Conversations List */}
            <div style={{ width: '350px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Messages</h1>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedUser(conv)}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '16px 24px',
                                    cursor: 'pointer',
                                    background: selectedUser?.id === conv.id ? 'var(--bg)' : 'transparent',
                                    transition: 'background 0.2s',
                                    borderLeft: selectedUser?.id === conv.id ? '4px solid var(--primary)' : '4px solid transparent'
                                }}
                            >
                                <div className="avatar" style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'visible', position: 'relative' }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                        <img src={getImageUrl(conv.profilePicture) || `https://ui-avatars.com/api/?name=${conv.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    </div>
                                    <OnlineIndicator
                                        isOnline={getUserStatus(conv.id).isOnline}
                                        lastSeen={getUserStatus(conv.id).lastSeen}
                                        size="medium"
                                        position="bottom-right"
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <p style={{ fontWeight: '600', fontSize: '15px' }}>{conv.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {conv.lastMessage && formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '13px', color: conv.lastMessage?.isRead === false && conv.lastMessage?.senderId !== user.id ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: conv.lastMessage?.isRead === false && conv.lastMessage?.senderId !== user.id ? '700' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {conv.lastMessage?.image ? 'Sent an image' : (conv.lastMessage?.content || 'Started a conversation')}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No conversations yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)' }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header (Matched to screenshot) */}
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center', background: 'var(--card-bg)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="avatar" style={{ width: '32px', height: '32px', margin: '0 auto 4px', overflow: 'visible', position: 'relative' }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                        <img src={getImageUrl(selectedUser.profilePicture) || `https://ui-avatars.com/api/?name=${selectedUser.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    </div>
                                    <OnlineIndicator
                                        isOnline={getUserStatus(selectedUser.id).isOnline}
                                        lastSeen={getUserStatus(selectedUser.id).lastSeen}
                                        size="small"
                                        position="bottom-right"
                                    />
                                </div>
                                <p style={{ fontWeight: '700', fontSize: '14px', lineHeight: 1 }}>{selectedUser.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{selectedUser.username}</p>
                                {getUserStatus(selectedUser.id).isOnline ? (
                                    <p style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>● Online</p>
                                ) : getUserStatus(selectedUser.id).lastSeen ? (
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Last seen {formatDistanceToNow(getUserStatus(selectedUser.id).lastSeen!)} ago
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* Messages List (Matched to screenshot) */}
                        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user.id;
                                return (
                                    <React.Fragment key={msg.id}>
                                        <div
                                            className={`chat-bubble ${isMe ? 'sender msg-sent-animate' : 'receiver msg-received-animate'}`}
                                            style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}
                                        >
                                            {msg.image && <img src={getImageUrl(msg.image)} className="chat-image" alt="shared" />}
                                            {msg.content}
                                        </div>
                                        <span className="chat-time">
                                            {format(new Date(msg.createdAt), 'hh:mm a')}
                                        </span>
                                    </React.Fragment>
                                );
                            })}
                            {peerTyping && (
                                <div style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '20px', background: 'var(--bg)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input (Matched to screenshot) */}
                        <div style={{ padding: '20px 40px 32px', flexShrink: 0 }}>
                            {imagePreview && (
                                <div style={{ position: 'relative', marginBottom: '12px', display: 'inline-block' }}>
                                    <img src={imagePreview} style={{ height: '80px', borderRadius: '12px' }} alt="preview" />
                                    <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '2px' }}><X size={14} /></button>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="chat-input-container">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTypingInput}
                                    onBlur={stopTyping}
                                    placeholder="Type a message..."
                                    className="chat-input"
                                />
                                <label className="chat-icon-btn" style={{ cursor: 'pointer', margin: 0 }}>
                                    <ImageIcon size={20} />
                                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                                </label>
                                <button type="submit" className="chat-send-btn">
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <User size={40} />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: '600' }}>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
