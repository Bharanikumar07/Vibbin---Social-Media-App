import React, { useState } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
            if (res.data.link) {
                // Development mode convenience
                console.log('Reset Link:', res.data.link);
                // Optionally show it in UI for easier testing
                setMessage(prev => `${prev} (Dev Mode: ${res.data.link})`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <Logo size={32} />
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Forgot Password</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>Enter your email to receive a reset link</p>

                {message && <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{message}</div>}
                {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none' }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
