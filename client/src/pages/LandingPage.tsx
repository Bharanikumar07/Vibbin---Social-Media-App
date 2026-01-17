import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
    const [showSplash, setShowSplash] = useState(false);
    const navigate = useNavigate();

    const handleContinue = () => {
        setShowSplash(true);
        setTimeout(() => {
            navigate('/login');
        }, 3000); // Show splash for 3 seconds
    };

    if (showSplash) {
        return (
            <div className="splash-screen" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: 'fadeIn 0.5s ease-out'
            }}>
                <div style={{
                    textAlign: 'center',
                    animation: 'scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                    <Logo size={120} showText={true} showTagline={false} />

                    <div style={{ marginTop: '40px', opacity: 0, animation: 'fadeInUp 0.5s ease-out 0.5s forwards' }}>
                        <h1 style={{
                            fontSize: '42px',
                            fontWeight: '800',
                            color: 'var(--text-main)',
                            marginBottom: '16px',
                            letterSpacing: '-0.02em'
                        }}>
                            HI Reticent😄
                        </h1>
                        <p style={{
                            fontSize: '20px',
                            color: 'var(--text-muted)',
                            fontWeight: '500'
                        }}>
                            How have you being?
                        </p>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeInUp {
                        from { 
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes scaleUp {
                        from { 
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to { 
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="auth-page landing-page" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div className="landing-content" style={{
                maxWidth: '600px',
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
                    <Logo size={80} showTagline={true} />
                </div>

                <h1 style={{
                    fontSize: '56px',
                    fontWeight: '900',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    lineHeight: '1.1',
                    letterSpacing: '-0.03em'
                }}>
                    The vibe you've been<br />
                    <span style={{
                        background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>waiting for.</span>
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: 'var(--text-muted)',
                    marginBottom: '40px',
                    lineHeight: '1.6'
                }}>
                    Experience the next generation of social connection.
                    Simple, fast, and full of good vibes.
                </p>

                <button
                    onClick={handleContinue}
                    className="btn-continue"
                    style={{
                        padding: '18px 48px',
                        fontSize: '18px',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        width: 'auto'
                    }}
                >
                    Continue to Vibbin
                    <ArrowRight size={22} style={{ marginLeft: '12px' }} />
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
