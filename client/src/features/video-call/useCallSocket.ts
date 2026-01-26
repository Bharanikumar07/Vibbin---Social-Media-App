import { useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import type { IncomingCallData, CallEndedData } from './call.types';
import { CALL_TIMEOUT_MS } from './call.types';

interface UseCallSocketProps {
    socket: Socket | null;
    onIncomingCall: (data: IncomingCallData) => void;
    onCallAccepted: () => void;
    onCallRejected: () => void;
    onCallEnded: (data: CallEndedData) => void;
    onCallError: (error: string) => void;
    onCallRinging: () => void;
}

export const useCallSocket = ({
    socket,
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onCallError,
    onCallRinging
}: UseCallSocketProps) => {
    const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Start a call
    const startCall = useCallback((targetUserId: string) => {
        if (!socket) {
            onCallError('Socket not connected');
            return;
        }

        console.log('📞 Starting call to:', targetUserId);
        socket.emit('call-user', { targetUserId });

        // Set call timeout (30 seconds)
        callTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Call timeout - no answer');
            socket.emit('end-call', { targetUserId });
            onCallEnded({ endedBy: 'timeout', reason: 'No answer' });
        }, CALL_TIMEOUT_MS);
    }, [socket, onCallEnded, onCallError]);

    // Accept incoming call
    const acceptCall = useCallback((callerId: string) => {
        if (!socket) return;

        console.log('✅ Accepting call from:', callerId);
        socket.emit('accept-call', { callerId });
    }, [socket]);

    // Reject incoming call
    const rejectCall = useCallback((callerId: string) => {
        if (!socket) return;

        console.log('❌ Rejecting call from:', callerId);
        socket.emit('reject-call', { callerId });
    }, [socket]);

    // End call
    const endCall = useCallback((targetUserId: string) => {
        if (!socket) return;

        console.log('📴 Ending call with:', targetUserId);
        socket.emit('end-call', { targetUserId });

        // Clear timeout
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
    }, [socket]);

    // Clear call timeout
    const clearCallTimeout = useCallback(() => {
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data: IncomingCallData) => {
            console.log('📲 Incoming call:', data);
            onIncomingCall(data);
        };

        const handleCallAccepted = (data: { acceptedBy: string }) => {
            console.log('✅ Call accepted by:', data.acceptedBy);
            clearCallTimeout();
            onCallAccepted();
        };

        const handleCallRejected = (data: { rejectedBy: string }) => {
            console.log('❌ Call rejected by:', data.rejectedBy);
            clearCallTimeout();
            onCallRejected();
        };

        const handleCallEnded = (data: CallEndedData) => {
            console.log('📴 Call ended:', data);
            clearCallTimeout();
            onCallEnded(data);
        };

        const handleCallError = (data: { message: string }) => {
            console.error('📞 Call error:', data.message);
            clearCallTimeout();
            onCallError(data.message);
        };

        const handleCallRinging = () => {
            console.log('🔔 Call is ringing...');
            onCallRinging();
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-accepted', handleCallAccepted);
        socket.on('call-rejected', handleCallRejected);
        socket.on('call-ended', handleCallEnded);
        socket.on('call-error', handleCallError);
        socket.on('call-ringing', handleCallRinging);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-accepted', handleCallAccepted);
            socket.off('call-rejected', handleCallRejected);
            socket.off('call-ended', handleCallEnded);
            socket.off('call-error', handleCallError);
            socket.off('call-ringing', handleCallRinging);
            clearCallTimeout();
        };
    }, [socket, onIncomingCall, onCallAccepted, onCallRejected, onCallEnded, onCallError, onCallRinging, clearCallTimeout]);

    return {
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        clearCallTimeout
    };
};
