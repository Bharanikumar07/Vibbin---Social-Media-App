import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Bell, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import '../styles/Notifications.css';

const MobileNav = () => {
    const { user } = useAuth();
    const { unreadCount, showBellAnimation } = useNotifications();

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'var(--card-bg)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 10px',
            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
            zIndex: 1000,
            borderTop: '1px solid var(--border)'
        }}>
            <style>{`
        @media (min-width: 1025px) {
          nav { display: none !important; }
        }
        @media (max-width: 1024px) {
            nav { display: flex !important; }
        }
      `}</style>
            <NavLink to="/" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}>
                <Home size={24} />
            </NavLink>
            <NavLink to="/discover" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}>
                <Search size={24} />
            </NavLink>
            <NavLink to="/notifications" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)', position: 'relative' })}>
                <div style={{ position: 'relative' }}>
                    <Bell size={24} className={showBellAnimation ? 'bell-shake' : ''} />
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
            </NavLink>
            <NavLink to="/messages" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}>
                <MessageSquare size={24} />
            </NavLink>
            <NavLink to={`/profile/${user?.username}`} style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-muted)' })}>
                <User size={24} />
            </NavLink>
        </nav>
    );
};

export default MobileNav;
