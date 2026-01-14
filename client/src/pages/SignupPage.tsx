import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Zap, ArrowRight, Moon, Sun } from 'lucide-react';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isRotating, setIsRotating] = useState(false);
    const { signup } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleThemeToggle = () => {
        setIsRotating(true);
        toggleTheme();
        setTimeout(() => setIsRotating(false), 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signup(formData);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    return (
        <div className="auth-page">
            {/* Theme Toggle Button */}
            <button
                onClick={handleThemeToggle}
                style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 1000,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                className="btn-ripple"
            >
                <span className={`theme-toggle-icon ${isRotating ? 'rotating' : ''}`} style={{ display: 'inline-flex' }}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </span>
            </button>

            <div className="auth-container">
                <div className="auth-content" style={{
                    animation: 'fadeInUp 0.6s ease-out',
                    opacity: 1
                }}>
                    <div className="logo">
                        <Zap fill="currentColor" size={28} />
                        <span>vibbin</span>
                    </div>

                    <h1 className="hero-title" style={{
                        fontSize: '56px',
                        animation: 'fadeInUp 0.7s ease-out'
                    }}>
                        Join the global<br />
                        community today
                    </h1>
                    <p className="hero-subtitle" style={{
                        animation: 'fadeInUp 0.8s ease-out'
                    }}>
                        Create an account to start vibbin with your friends.
                    </p>
                </div>

                <div className="auth-card" style={{
                    animation: 'slideInRight 0.6s ease-out'
                }}>
                    <div className="auth-card-body">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
                            Free forever. No credit card required.
                        </p>

                        {error && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Bharanikumar"
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="bharan"
                                        required
                                    />
                                </div>
                            </div>

                            <label>Email address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="bharan@vibbin.com"
                                required
                            />

                            <label>Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                required
                            />

                            <button type="submit" className="btn-continue">
                                Get Started
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                    <div className="auth-card-footer">
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
