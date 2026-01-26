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

    // Helper to process queued ICE candidates
    const processPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        if (!pc.remoteDescription) return;

        const count = pendingIceCandidates.current.length;
        if (count > 0) {
            console.log(`🧊 WebRTC: Processing ${count} queued ICE candidates`);
            while (pendingIceCandidates.current.length > 0) {
                const candidate = pendingIceCandidates.current.shift();
                if (candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('❌ WebRTC: Error adding queued ICE candidate:', e);
                    }
                }
            }
        }
    }, []);

    // Initialize peer connection
    const createPeerConnection = useCallback(() => {
        console.log('🏗️ WebRTC: Creating RTCPeerConnection for target:', targetUserIdRef.current);
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current && targetUserIdRef.current) {
                // console.log('🧊 WebRTC: Local ICE candidate generated');
                socketRef.current.emit('ice-candidate', {
                    targetUserId: targetUserIdRef.current,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('🎥 WebRTC: Remote track received:', event.streams.length, 'streams');
            if (event.streams && event.streams[0]) {
                console.log('🎥 WebRTC: Remote stream ID:', event.streams[0].id);
                onRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('📡 WebRTC: Connection state change:', pc.connectionState);
            onConnectionStateChange(pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 WebRTC: ICE connection state change:', pc.iceConnectionState);
        };

        pc.onicegatheringstatechange = () => {
            console.log('🧊 WebRTC: ICE gathering state:', pc.iceGatheringState);
        };

        pc.onsignalingstatechange = () => {
            console.log('📶 WebRTC: Signaling state change:', pc.signalingState);
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
            console.log('📹 WebRTC: Requesting media access...');
            const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

            stream.getTracks().forEach(track => {
                track.enabled = true;
                console.log(`🎤 WebRTC: Track enabled: ${track.kind} - ${track.label}`);
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('❌ WebRTC: Failed to get media stream:', error);
            const errorMessage = error instanceof Error ? error.message : 'Camera/microphone permission denied';
            throw new Error(errorMessage);
        }
    }, []);

    // Create and send offer (caller)
    const createOffer = useCallback(async () => {
        if (!socketRef.current || !targetUserIdRef.current) {
            console.error('❌ WebRTC: createOffer failed - No socket or target user');
            return;
        }

        console.log('🚀 WebRTC: Initiating offer (Caller)');
        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            console.log('➕ WebRTC: Adding local track to PC:', track.kind);
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
            console.error('❌ WebRTC: Failed to create/set offer:', error);
        }
    }, [createPeerConnection, initializeStream]);

    // Handle incoming offer and create answer (receiver)
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, callerId: string) => {
        if (!socketRef.current) return;

        console.log('🚀 WebRTC: Handling offer (Receiver) from:', callerId);
        targetUserIdRef.current = callerId;

        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            console.log('➕ WebRTC: Adding local track to PC:', track.kind);
            pc.addTrack(track, stream);
        });

        try {
            console.log('📥 WebRTC: Setting remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processPendingIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current.emit('webrtc-answer', {
                targetUserId: callerId,
                answer: pc.localDescription
            });
        } catch (error) {
            console.error('❌ WebRTC: Failed to handle offer/create answer:', error);
        }
    }, [createPeerConnection, initializeStream, processPendingIceCandidates]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.warn('⚠️ WebRTC: Received answer but peer connection does not exist');
            return;
        }

        try {
            console.log('📥 WebRTC: Setting remote description (answer)');
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await processPendingIceCandidates(pc);
        } catch (error) {
            console.error('❌ WebRTC: Failed to set remote description (answer):', error);
        }
    }, [processPendingIceCandidates]);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;

        if (!pc || !pc.remoteDescription) {
            // console.log('🧊 WebRTC: ICE candidate queued: PC/remote desc not ready');
            pendingIceCandidates.current.push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            // console.log('🧊 WebRTC: Remote ICE candidate added directly');
        } catch (error) {
            console.error('❌ WebRTC: Failed to add ICE candidate:', error);
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
        console.log('🧹 WebRTC: Cleaning up resources');
        pendingIceCandidates.current = [];

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            localStreamRef.current = null;
            setLocalStream(null);
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.oniceconnectionstatechange = null;
            peerConnectionRef.current.onicegatheringstatechange = null;
            peerConnectionRef.current.onsignalingstatechange = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        setIsMuted(false);
        setIsCameraOff(false);
    }, []);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const onWebRTCOffer = async (data: { offer: RTCSessionDescriptionInit; callerId: string }) => {
            console.log('📶 Signaling: webrtc-offer received');
            await handleOffer(data.offer, data.callerId);
        };

        const onWebRTCAnswer = (data: { answer: RTCSessionDescriptionInit }) => {
            console.log('📶 Signaling: webrtc-answer received');
            handleAnswer(data.answer);
        };

        const onIceCandidate = (data: { candidate: RTCIceCandidateInit }) => {
            handleIceCandidate(data.candidate);
        };

        socket.on('webrtc-offer', onWebRTCOffer);
        socket.on('webrtc-answer', onWebRTCAnswer);
        socket.on('ice-candidate', onIceCandidate);

        return () => {
            socket.off('webrtc-offer', onWebRTCOffer);
            socket.off('webrtc-answer', onWebRTCAnswer);
            socket.off('ice-candidate', onIceCandidate);
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
