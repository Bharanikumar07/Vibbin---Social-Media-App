import { useEffect, useRef, useCallback, useState } from 'react';
import { ICE_SERVERS, MEDIA_CONSTRAINTS } from './call.types';
import type { Socket } from 'socket.io-client';

interface UseWebRTCProps {
    socket: Socket | null;
    targetUserId: string | null;
    onRemoteStream: (stream: MediaStream) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export const useWebRTC = ({
    socket,
    targetUserId,
    onRemoteStream,
    onConnectionStateChange
}: UseWebRTCProps) => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);

    // Queue for ICE candidates that arrive before remote description is set
    const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);

    // Refs to keep track of socket and targetUserId without triggering re-renders or stale closures
    const socketRef = useRef<Socket | null>(socket);
    const targetUserIdRef = useRef<string | null>(targetUserId);

    // Update refs when props change
    useEffect(() => {
        socketRef.current = socket;
        targetUserIdRef.current = targetUserId;
    }, [socket, targetUserId]);

    // Initialize peer connection
    const createPeerConnection = useCallback(() => {
        console.log('🏗️ Creating RTCPeerConnection for target:', targetUserIdRef.current);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current && targetUserIdRef.current) {
                socketRef.current.emit('ice-candidate', {
                    targetUserId: targetUserIdRef.current,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('🎥 Remote track received:', event.streams.length, 'streams');
            if (event.streams && event.streams[0]) {
                console.log('🎥 Remote stream ID:', event.streams[0].id);
                onRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('📡 Peer connection state:', pc.connectionState);
            onConnectionStateChange(pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [onRemoteStream, onConnectionStateChange]);

    // Initialize local media stream
    const initializeStream = useCallback(async (): Promise<MediaStream> => {
        if (localStreamRef.current) {
            return localStreamRef.current;
        }

        try {
            console.log('📹 Requesting media access...');
            const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

            stream.getTracks().forEach(track => {
                track.enabled = true;
                console.log(`🎤 Track enabled: ${track.kind}`);
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('❌ Failed to get media stream:', error);
            throw error;
        }
    }, []);

    // Helper to process queued ICE candidates
    const processPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        if (!pc.remoteDescription) return;

        const count = pendingIceCandidates.current.length;
        if (count > 0) {
            console.log(`🧊 Processing ${count} queued ICE candidates`);
            while (pendingIceCandidates.current.length > 0) {
                const candidate = pendingIceCandidates.current.shift();
                if (candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('❌ Error adding queued ICE candidate:', e);
                    }
                }
            }
        }
    }, []);

    // Create and send offer (caller)
    const createOffer = useCallback(async () => {
        if (!socketRef.current || !targetUserIdRef.current) return;

        console.log('🚀 WebRTC: Initiating offer (Caller)');
        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current.emit('webrtc-offer', {
                targetUserId: targetUserIdRef.current,
                offer: pc.localDescription
            });
        } catch (error) {
            console.error('❌ Failed to create offer:', error);
        }
    }, [createPeerConnection, initializeStream]);

    // Handle incoming offer and create answer (receiver)
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, callerId: string) => {
        if (!socketRef.current) return;

        console.log('🚀 WebRTC: Handling offer (Receiver)');
        targetUserIdRef.current = callerId;

        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processPendingIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('webrtc-answer', {
                targetUserId: callerId,
                answer: pc.localDescription
            });
        } catch (error) {
            console.error('❌ Failed to handle offer:', error);
        }
    }, [createPeerConnection, initializeStream, processPendingIceCandidates]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
            console.log('📥 Setting WebRTC answer');
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await processPendingIceCandidates(pc);
        } catch (error) {
            console.error('❌ Failed to set answer:', error);
        }
    }, [processPendingIceCandidates]);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;

        if (!pc || !pc.remoteDescription) {
            pendingIceCandidates.current.push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('❌ Failed to add ICE candidate:', error);
        }
    }, []);

    // Toggle controls
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOff(!videoTrack.enabled);
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        console.log('🧹 WebRTC Cleanup');
        pendingIceCandidates.current = [];

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.oniceconnectionstatechange = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        setIsMuted(false);
        setIsCameraOff(false);
    }, []);

    // Listen for signaling
    useEffect(() => {
        if (!socket) return;

        const onOffer = (data: any) => handleOffer(data.offer, data.callerId);
        const onAnswer = (data: any) => handleAnswer(data.answer);
        const onCandidate = (data: any) => handleIceCandidate(data.candidate);

        socket.on('webrtc-offer', onOffer);
        socket.on('webrtc-answer', onAnswer);
        socket.on('ice-candidate', onCandidate);

        return () => {
            socket.off('webrtc-offer', onOffer);
            socket.off('webrtc-answer', onAnswer);
            socket.off('ice-candidate', onCandidate);
        };
    }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

    return {
        localStream,
        isMuted,
        isCameraOff,
        createOffer,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        toggleMute,
        toggleCamera,
        initializeStream,
        cleanup
    };
};
