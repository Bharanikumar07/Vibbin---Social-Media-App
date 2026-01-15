import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GoogleLogin } from '@react-oauth/google';
import { Star, ArrowRight, Moon, Sun } from 'lucide-react';
import Logo from '../components/Logo';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRotating, setIsRotating] = useState(false);
    const { login, googleLogin } = useAuth();
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
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                await googleLogin(credentialResponse.credential);
                navigate('/');
            }
        } catch (err) {
            setError('Google login failed');
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
                    <div className="logo" style={{ marginBottom: '32px' }}>
                        <Logo size={48} showTagline={true} />
                    </div>

                    <div className="testimonial" style={{
                        animation: 'fadeInUp 0.7s ease-out'
                    }}>
                        <div className="testimonial-avatars">
                            <img src="https://i.pravatar.cc/150?u=1" alt="user" />
                            <img src="https://i.pravatar.cc/150?u=2" alt="user" />
                            <img src="https://i.pravatar.cc/150?u=3" alt="user" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                            </div>
                            <span className="testimonial-text">Used by 12k+ developers</span>
                        </div>
                    </div>

                    <h1 className="hero-title" style={{
                        animation: 'fadeInUp 0.8s ease-out'
                    }}>
                        More than just friends<br />
                        truly connect
                    </h1>
                    <p className="hero-subtitle" style={{
                        animation: 'fadeInUp 0.9s ease-out'
                    }}>
                        connect with global community on vibbin.
                    </p>
                </div>

                <div className="auth-card" style={{
                    animation: 'slideInRight 0.6s ease-out'
                }}>
                    <div className="auth-card-body">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Sign in to</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
                            Welcome back! Please sign in to continue
                        </p>

                        {error && <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

                        <form onSubmit={handleSubmit}>
                            <label>Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ marginBottom: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Forgot Password?</Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />

                            <button type="submit" className="btn-continue">
                                Continue
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }}></div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google login failed')}
                                useOneTap
                                theme="outline"
                                shape="rectangular"
                                width="360"
                            />
                        </div>
                    </div>
                    <div className="auth-card-footer">
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
