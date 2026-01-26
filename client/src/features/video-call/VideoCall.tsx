import React, { useCallback, useEffect, useRef } from 'react';
import { useVideoCall } from './VideoCallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import './VideoCall.css';

// Format duration to MM:SS
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Incoming Call Modal Component
export const IncomingCallModal: React.FC = () => {
    const { incomingCall, callState, acceptCall, rejectCall } = useVideoCall();

    if (!incomingCall || callState !== 'ringing') return null;

    return (
        <div className="video-call-overlay">
            <div className="incoming-call-modal">
                <div className="incoming-call-pulse"></div>
                <div className="caller-avatar">
                    {incomingCall.callerInfo.profilePicture ? (
                        <img
                            src={incomingCall.callerInfo.profilePicture}
                            alt={incomingCall.callerInfo.name}
                        />
                    ) : (
                        <div className="avatar-placeholder">
                            {incomingCall.callerInfo.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <h3 className="caller-name">{incomingCall.callerInfo.name}</h3>
                <p className="call-status-text">Incoming Video Call...</p>

                <div className="incoming-call-actions">
                    <button
                        className="call-action-btn reject-btn"
                        onClick={rejectCall}
                    >
                        <PhoneOff size={28} />
                        <span>Decline</span>
                    </button>
                    <button
                        className="call-action-btn accept-btn"
                        onClick={acceptCall}
                    >
                        <Phone size={28} />
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Video Call Component
export const VideoCall: React.FC = () => {
    const {
        callState,
        localStream,
        remoteStream,
        targetUserInfo,
        isMuted,
        isCameraOff,
        callDuration,
        error,
        endCall,
        toggleMute,
        toggleCamera,
        resetCall
    } = useVideoCall();

    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Callback ref to attach local stream
    const setLocalVideo = useCallback((node: HTMLVideoElement | null) => {
        if (node && localStream) {
            node.srcObject = localStream;
            node.play().catch(err => console.error("Error playing local video:", err));
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => console.error("Error playing remote video:", err));
        }
    }, [remoteStream]);

    // Don't render main UI if idle or ringing (ringing is handled by IncomingCallModal)
    if (callState === 'idle' || callState === 'ringing') return null;

    const isConnecting = callState === 'calling' || callState === 'connecting';
    const isConnected = callState === 'connected';
    const isEnded = callState === 'ended';

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                {/* Remote Video (Main View) */}
                <div className="remote-video-container">
                    {remoteStream && isConnected ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="remote-video"
                        />
                    ) : (
                        <div className="video-placeholder">
                            {targetUserInfo?.profilePicture ? (
                                <img
                                    src={targetUserInfo.profilePicture}
                                    alt={targetUserInfo.name}
                                    className="placeholder-avatar"
                                />
                            ) : (
                                <div className="placeholder-avatar-text">
                                    {targetUserInfo?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                            {isConnecting && (
                                <div className="connecting-status">
                                    <div className="connecting-spinner"></div>
                                    <p>{callState === 'calling' ? 'Calling...' : 'Establishing Secure Connection...'}</p>
                                    <span className="troubleshoot-hint">
                                        Hint: Ensure both users are on stable internet and have granted camera access.
                                    </span>
                                </div>
                            )}
                            {!isConnecting && !isConnected && !isEnded && (
                                <div className="connecting-status">
                                    <div className="connecting-spinner"></div>
                                    <p>Connecting...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Local Video (Picture-in-Picture) */}
                <div className={`local-video-container ${isCameraOff ? 'camera-off' : ''}`}>
                    {localStream && (
                        <video
                            ref={setLocalVideo}
                            autoPlay
                            playsInline
                            muted
                            className={`local-video ${isCameraOff ? 'hidden' : ''}`}
                            style={{ display: isCameraOff ? 'none' : 'block' }}
                        />
                    )}
                    {isCameraOff && (
                        <div className="local-video-off">
                            <VideoOff size={24} />
                        </div>
                    )}
                </div>

                {/* Call Info Header */}
                <div className="call-header">
                    <div className="call-user-info">
                        <h3>{targetUserInfo?.name || 'Unknown'}</h3>
                        {isConnected && (
                            <span className="call-duration">{formatDuration(callDuration)}</span>
                        )}
                        {isConnecting && (
                            <span className="call-status">
                                {callState === 'calling' ? 'Ringing...' : 'Connecting...'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="call-error">
                        <p>{error}</p>
                    </div>
                )}

                {/* Call Ended State */}
                {isEnded && (
                    <div className="call-ended-overlay">
                        <div className="call-ended-content">
                            <PhoneOff size={48} />
                            <h3>Call Ended</h3>
                            {callDuration > 0 && (
                                <p>Duration: {formatDuration(callDuration)}</p>
                            )}
                            <button onClick={resetCall} className="close-call-btn">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Call Controls */}
                {!isEnded && (
                    <div className="call-controls">
                        <button
                            className={`control-btn ${isMuted ? 'active' : ''}`}
                            onClick={toggleMute}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>

                        <button
                            className={`control-btn ${isCameraOff ? 'active' : ''}`}
                            onClick={toggleCamera}
                            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
                        >
                            {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>

                        <button
                            className="control-btn end-call-btn"
                            onClick={endCall}
                            title="End call"
                        >
                            <PhoneOff size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Video Call Wrapper - renders both incoming call modal and active call
export const VideoCallWrapper: React.FC = () => {
    return (
        <>
            <IncomingCallModal />
            <VideoCall />
        </>
    );
};

export default VideoCall;
