import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Users, Compass, User, Plus, LogOut, Moon, Sun, Bell, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOnlinePresence } from '../hooks/useOnlinePresence.ts';
import { useNotifications } from '../context/NotificationContext';
import OnlineIndicator from './OnlineIndicator.tsx';
import Logo from './Logo';
import { useState } from 'react';
import { getImageUrl } from '../config';
import '../styles/Notifications.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { getUserStatus } = useOnlinePresence();
    const { unreadCount, showBellAnimation, soundEnabled, toggleSound } = useNotifications();
    const navigate = useNavigate();
    const [isRotating, setIsRotating] = useState(false);

    const handleThemeToggle = () => {
        setIsRotating(true);
        toggleTheme();
        setTimeout(() => setIsRotating(false), 500);
    };

    const navItems = [
        { icon: <Home size={22} />, label: 'Feed', path: '/' },
        { icon: <MessageSquare size={22} />, label: 'Messages', path: '/messages' },
        { icon: <Users size={22} />, label: 'Connections', path: '/connections' },
        { icon: <Compass size={22} />, label: 'Discover', path: '/discover' },
        {
            icon: (
                <div style={{ position: 'relative' }}>
                    <Bell size={22} className={showBellAnimation ? 'bell-shake' : ''} />
                    {unreadCount > 0 && (
                        <span className="notification-badge" style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            minWidth: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                            border: '2px solid var(--bg)'
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            ),
            label: 'Notifications',
            path: '/notifications'
        },
        { icon: <User size={22} />, label: 'Profile', path: `/profile/me` },
    ];



    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ justifyContent: 'space-between', padding: '16px' }}>
                <Logo size={32} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={toggleSound} style={{ color: 'var(--text-muted)' }} className="btn-ripple" title={soundEnabled ? 'Mute notifications' : 'Enable sound'}>
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={handleThemeToggle} style={{ color: 'var(--text-muted)' }} className="btn-ripple">
                        <span className={`theme-toggle-icon ${isRotating ? 'rotating' : ''}`} style={{ display: 'inline-flex' }}>
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </span>
                    </button>
                </div>
            </div>

            <nav className="nav-links">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <button
                    onClick={() => navigate('/')}
                    className="btn-create-post"
                >
                    <Plus size={20} />
                    Create Post
                </button>
            </nav>

            <div className="sidebar-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="user-summary">
                        <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', background: '#f5f3ff', position: 'relative', overflow: 'visible' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user?.profilePicture ? (
                                    <img src={getImageUrl(user.profilePicture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user?.name?.[0]
                                )}
                            </div>
                            <OnlineIndicator
                                isOnline={getUserStatus(user?.id || '').isOnline}
                                lastSeen={getUserStatus(user?.id || '').lastSeen}
                                size="medium"
                                position="bottom-right"
                            />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{user?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
