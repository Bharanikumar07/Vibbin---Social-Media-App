import { useEffect, useRef, useCallback, useState } from 'react';
import { ICE_SERVERS, MEDIA_CONSTRAINTS } from './call.types';
import type { CallerInfo } from './call.types';
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

    // Initialize peer connection
    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && targetUserId) {
                socket.emit('ice-candidate', {
                    targetUserId,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('🎥 Remote track received:', event.streams);
            if (event.streams[0]) {
                onRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('📡 Connection state:', pc.connectionState);
            onConnectionStateChange(pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, targetUserId, onRemoteStream, onConnectionStateChange]);

    // Get local media stream
    const getLocalStream = useCallback(async (): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
            localStreamRef.current = stream;
            setLocalStream(stream);
            console.log('📹 Local stream acquired');
            return stream;
        } catch (error) {
            console.error('Failed to get media stream:', error);
            throw new Error('Camera/microphone permission denied');
        }
    }, []);

    // Create and send offer (caller)
    const createOffer = useCallback(async () => {
        if (!socket || !targetUserId) return;

        const pc = createPeerConnection();
        const stream = await getLocalStream();

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log('📤 Sending WebRTC offer');
        socket.emit('webrtc-offer', {
            targetUserId,
            offer: pc.localDescription
        });
    }, [socket, targetUserId, createPeerConnection, getLocalStream]);

    // Handle incoming offer and create answer (receiver)
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, callerId: string) => {
        if (!socket) return;

        const pc = createPeerConnection();
        const stream = await getLocalStream();

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Set remote description
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('📤 Sending WebRTC answer');
        socket.emit('webrtc-answer', {
            targetUserId: callerId,
            answer: pc.localDescription
        });
    }, [socket, createPeerConnection, getLocalStream]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        console.log('📥 Received WebRTC answer');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('🧊 ICE candidate added');
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
            console.log(`🎤 Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
        }
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOff(!videoTrack.enabled);
            console.log(`📹 Video ${videoTrack.enabled ? 'on' : 'off'}`);
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up WebRTC resources');

        // Stop all local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`Track ${track.kind} stopped`);
            });
            localStreamRef.current = null;
            setLocalStream(null);
        }

        // Close peer connection
        if (peerConnectionRef.current) {
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
            console.log('📥 Received WebRTC offer from', data.callerId);
            await handleOffer(data.offer, data.callerId);
        };

        const onWebRTCAnswer = (data: { answer: RTCSessionDescriptionInit }) => {
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
        cleanup
    };
};
