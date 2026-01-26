import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useWebRTC } from './useWebRTC';
import { useCallSocket } from './useCallSocket';
import { callSoundManager } from '../../utils/callSounds';
import type {
    VideoCallState,
    VideoCallActions,
    VideoCallContextType,
    CallState,
    IncomingCallData,
    CallerInfo,
    CallEndedData
} from './call.types';

const initialState: VideoCallState = {
    callState: 'idle',
    localStream: null,
    remoteStream: null,
    targetUserId: null,
    targetUserInfo: null,
    incomingCall: null,
    isMuted: false,
    isCameraOff: false,
    callDuration: 0,
    error: null
};

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export const useVideoCall = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCall must be used within VideoCallProvider');
    }
    return context;
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const socket = useSocket();
    const [state, setState] = useState<VideoCallState>(initialState);
    const callDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callStartTimeRef = useRef<Date | null>(null);

    // Update state helper
    const updateState = useCallback((updates: Partial<VideoCallState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Handle remote stream
    const handleRemoteStream = useCallback((stream: MediaStream) => {
        console.log('🎥 Remote stream received');
        updateState({ remoteStream: stream });
    }, [updateState]);

    // Handle connection state change
    const handleConnectionStateChange = useCallback((connectionState: RTCPeerConnectionState) => {
        console.log('📡 Connection state:', connectionState);
        if (connectionState === 'connected') {
            updateState({ callState: 'connected' });
            // Start duration timer
            callStartTimeRef.current = new Date();
            callDurationIntervalRef.current = setInterval(() => {
                if (callStartTimeRef.current) {
                    const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
                    updateState({ callDuration: duration });
                }
            }, 1000);
        } else if (connectionState === 'disconnected' || connectionState === 'failed') {
            updateState({ callState: 'ended' });
        } else if (connectionState === 'connecting') {
            updateState({ callState: 'connecting' });
        }
    }, [updateState]);

    // WebRTC hook
    const webRTC = useWebRTC({
        socket,
        targetUserId: state.targetUserId,
        onRemoteStream: handleRemoteStream,
        onConnectionStateChange: handleConnectionStateChange
    });

    // Handle incoming call
    const handleIncomingCall = useCallback((data: IncomingCallData) => {
        console.log('📲 Incoming call from:', data.callerId);
        updateState({
            incomingCall: data,
            callState: 'ringing'
        });
    }, [updateState]);

    // Handle call accepted
    const handleCallAccepted = useCallback(async () => {
        console.log('✅ Call accepted by remote user, starting handshake');
        updateState({ callState: 'connecting' });
        // Create WebRTC offer
        await webRTC.createOffer();
    }, [updateState, webRTC]);

    // Handle call rejected
    const handleCallRejected = useCallback(() => {
        updateState({
            callState: 'ended',
            error: 'Call was rejected'
        });
        webRTC.cleanup();
    }, [updateState, webRTC]);

    // Handle call ended
    const handleCallEnded = useCallback((data: CallEndedData) => {
        updateState({
            callState: 'ended',
            callDuration: data.duration || state.callDuration
        });
        webRTC.cleanup();

        // Clear duration timer
        if (callDurationIntervalRef.current) {
            clearInterval(callDurationIntervalRef.current);
            callDurationIntervalRef.current = null;
        }
    }, [updateState, webRTC, state.callDuration]);

    // Handle call error
    const handleCallError = useCallback((error: string) => {
        updateState({
            callState: 'ended',
            error
        });
        webRTC.cleanup();
    }, [updateState, webRTC]);

    // Handle call ringing
    const handleCallRinging = useCallback(() => {
        console.log('🔔 Remote client is ringing');
        updateState({ callState: 'calling' });
    }, [updateState]);

    // Manage call sounds
    useEffect(() => {
        if (state.callState === 'calling') {
            callSoundManager.playRingback();
        } else if (state.callState === 'ringing') {
            callSoundManager.playIncomingRing();
        } else {
            callSoundManager.stop();
        }

        return () => {
            callSoundManager.stop();
        };
    }, [state.callState]);

    // Call socket hook
    const callSocket = useCallSocket({
        socket,
        onIncomingCall: handleIncomingCall,
        onCallAccepted: handleCallAccepted,
        onCallRejected: handleCallRejected,
        onCallEnded: handleCallEnded,
        onCallError: handleCallError,
        onCallRinging: handleCallRinging
    });

    // Actions
    const startCall = useCallback(async (targetUserId: string, targetUserInfo: CallerInfo) => {
        try {
            updateState({
                targetUserId,
                targetUserInfo,
                callState: 'calling',
                error: null
            });
            // Initialize camera immediately
            webRTC.initializeStream().catch(error => {
                console.error('Failed to initialize stream:', error);
                updateState({ error: 'Failed to access camera/microphone' });
            });
            callSocket.startCall(targetUserId);
        } catch (error) {
            console.error('Failed to start call:', error);
            updateState({
                callState: 'ended',
                error: error instanceof Error ? error.message : 'Failed to start call'
            });
        }
    }, [updateState, callSocket, webRTC]);

    const acceptCall = useCallback(async () => {
        if (!state.incomingCall) return;

        try {
            updateState({
                targetUserId: state.incomingCall.callerId,
                targetUserInfo: state.incomingCall.callerInfo,
                callState: 'connecting', // Use connecting while handshake starts
                incomingCall: null
            });
            callSocket.acceptCall(state.incomingCall.callerId);
        } catch (error) {
            console.error('Failed to accept call:', error);
            updateState({
                callState: 'ended',
                error: error instanceof Error ? error.message : 'Failed to accept call'
            });
        }
    }, [state.incomingCall, updateState, callSocket]);

    const rejectCall = useCallback(() => {
        if (!state.incomingCall) return;

        callSocket.rejectCall(state.incomingCall.callerId);
        updateState({
            incomingCall: null,
            callState: 'idle'
        });
    }, [state.incomingCall, callSocket, updateState]);

    const endCall = useCallback(() => {
        if (state.targetUserId) {
            callSocket.endCall(state.targetUserId);
        }
        webRTC.cleanup();
        updateState({
            callState: 'ended'
        });

        // Clear duration timer
        if (callDurationIntervalRef.current) {
            clearInterval(callDurationIntervalRef.current);
            callDurationIntervalRef.current = null;
        }
    }, [state.targetUserId, callSocket, webRTC, updateState]);

    const toggleMute = useCallback(() => {
        webRTC.toggleMute();
        updateState({ isMuted: !state.isMuted });
    }, [webRTC, updateState, state.isMuted]);

    const toggleCamera = useCallback(() => {
        webRTC.toggleCamera();
        updateState({ isCameraOff: !state.isCameraOff });
    }, [webRTC, updateState, state.isCameraOff]);

    const resetCall = useCallback(() => {
        webRTC.cleanup();
        setState(initialState);

        // Clear duration timer
        if (callDurationIntervalRef.current) {
            clearInterval(callDurationIntervalRef.current);
            callDurationIntervalRef.current = null;
        }
        callStartTimeRef.current = null;
    }, [webRTC]);

    // Sync local stream from webRTC
    useEffect(() => {
        if (webRTC.localStream !== state.localStream) {
            updateState({ localStream: webRTC.localStream });
        }
    }, [webRTC.localStream, state.localStream, updateState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            webRTC.cleanup();
            if (callDurationIntervalRef.current) {
                clearInterval(callDurationIntervalRef.current);
            }
        };
    }, []);

    const value: VideoCallContextType = {
        ...state,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        resetCall
    };

    return (
        <VideoCallContext.Provider value={value}>
            {children}
        </VideoCallContext.Provider>
    );
};

export default VideoCallContext;
