import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    showTagline?: boolean;
    className?: string;
    variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({
    size = 28,
    showText = true,
    showTagline = false,
    className = '',
    variant = 'default'
}) => {
    const primaryColor = variant === 'white' ? '#FFFFFF' : '#7C3AED'; // Deep Purple
    const secondaryColor = '#FBBF24'; // Vivid Yellow/Gold

    return (
        <div className={`logo-container ${className}`} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0px',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="logo-icon" style={{
                    width: size * 1.5,
                    height: size * 1.2,
                    position: 'relative',
                    marginBottom: showText ? -size * 0.2 : 0
                }}>
                    <svg
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ width: '100%', height: '100%', transform: 'rotate(-5deg)' }}
                    >
                        {/* Paper Plane - Stylized Outline */}
                        <path
                            d="M20 55L85 20L65 85L50 60L20 55Z"
                            stroke={secondaryColor}
                            strokeWidth="3"
                            strokeLinejoin="round"
                        />
                        {/* Main Wing Fill */}
                        <path
                            d="M85 20L50 60L65 85L85 20Z"
                            fill={primaryColor}
                        />
                        {/* Shaded/Highlight Wing */}
                        <path
                            d="M20 55L85 20L50 60L20 55Z"
                            fill={secondaryColor}
                            fillOpacity="0.3"
                        />
                    </svg>
                </div>

                {showText && (
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{
                            fontFamily: "'Outfit', 'Inter', sans-serif",
                            fontSize: `${size * 1.2}px`,
                            fontWeight: '700',
                            color: primaryColor,
                            letterSpacing: '-0.02em',
                            lineHeight: 0.9,
                            paddingLeft: '4px',
                            fontStyle: 'italic'
                        }}>
                            Vibbin
                        </span>

                        {showTagline && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                marginTop: '4px'
                            }}>
                                {/* The Swish */}
                                <svg width={size * 3.5} height="6" viewBox="0 0 120 8" fill="none">
                                    <path d="M2 5.5C30 5.5 60 1.5 118 5.5" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                <span style={{
                                    fontSize: `${size * 0.3}px`,
                                    fontWeight: '800',
                                    color: secondaryColor,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    marginTop: '2px',
                                    alignSelf: 'flex-end',
                                    whiteSpace: 'nowrap'
                                }}>
                                    STAY IN CONNECTION
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logo;
