import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import '../styles/OnlineIndicator.css';

interface OnlineIndicatorProps {
    isOnline: boolean;
    lastSeen?: Date | string;
    size?: 'small' | 'medium' | 'large';
    showLastSeen?: boolean;
    position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
    isOnline,
    lastSeen,
    size = 'medium',
    showLastSeen = false,
    position = 'bottom-right'
}) => {
    const sizeMap = {
        small: '8px',
        medium: '10px',
        large: '12px'
    };

    const positionMap = {
        'top-right': { top: '0', right: '0' },
        'bottom-right': { bottom: '0', right: '0' },
        'bottom-left': { bottom: '0', left: '0' },
        'top-left': { top: '0', left: '0' }
    };

    const getLastSeenText = () => {
        if (!lastSeen) return 'Offline';
        const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
        return `Last seen ${formatDistanceToNow(date)} ago`;
    };

    return (
        <>
            <div
                className={`online-indicator ${isOnline ? 'online' : 'offline'}`}
                style={{
                    width: sizeMap[size],
                    height: sizeMap[size],
                    ...positionMap[position]
                }}
                title={isOnline ? 'Online' : getLastSeenText()}
            />
            {showLastSeen && !isOnline && lastSeen && (
                <span className="last-seen-text">
                    {getLastSeenText()}
                </span>
            )}
        </>
    );
};

export default OnlineIndicator;
