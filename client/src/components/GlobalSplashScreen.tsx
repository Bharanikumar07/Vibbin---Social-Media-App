import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const GlobalSplashScreen = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Start fade out after 2.5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        // Remove from DOM after transition completes (3 seconds total)
        const removeTimer = setTimeout(() => {
            setShouldRender(false);
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div style={{
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
            zIndex: 99999,
            transition: 'opacity 0.5s ease-out, visibility 0.5s',
            opacity: isVisible ? 1 : 0,
            visibility: isVisible ? 'visible' : 'hidden'
        }}>
            <div style={{
                textAlign: 'center',
                animation: 'scaleUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <Logo size={120} showText={true} showTagline={false} />

                <div style={{
                    marginTop: '40px',
                    animation: 'fadeInUp 0.6s ease-out 0.4s both'
                }}>
                    <h1 style={{
                        fontSize: '42px',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        marginBottom: '16px',
                        letterSpacing: '-0.02em',
                        fontFamily: "'Outfit', 'Inter', sans-serif"
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
};

export default GlobalSplashScreen;
