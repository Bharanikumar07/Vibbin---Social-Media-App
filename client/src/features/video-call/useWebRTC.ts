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

    // Initialize peer connection
    const createPeerConnection = useCallback(() => {
        console.log('🏗️ Creating RTCPeerConnection');
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socket && targetUserId) {
                console.log('🧊 Local ICE candidate generated');
                socket.emit('ice-candidate', {
                    targetUserId,
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
            console.log('📡 Peer connection state change:', pc.connectionState);
            onConnectionStateChange(pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state change:', pc.iceConnectionState);
        };

        pc.onicegatheringstatechange = () => {
            console.log('🧊 ICE gathering state:', pc.iceGatheringState);
        };

        pc.onsignalingstatechange = () => {
            console.log('📶 Signaling state change:', pc.signalingState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socket, targetUserId, onRemoteStream, onConnectionStateChange]);

    // Initialize local media stream
    const initializeStream = useCallback(async (): Promise<MediaStream> => {
        if (localStreamRef.current) {
            return localStreamRef.current;
        }

        try {
            console.log('📹 Requesting media access with constraints:', MEDIA_CONSTRAINTS);
            const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);

            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
                console.log('🎤 Audio track enabled:', track.label);
            });
            stream.getVideoTracks().forEach(track => {
                track.enabled = true;
                console.log('📹 Video track enabled:', track.label);
            });

            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('❌ Failed to get media stream:', error);
            const errorMessage = error instanceof Error ? error.message : 'Camera/microphone permission denied';
            throw new Error(errorMessage);
        }
    }, []);

    // Helper to process queued ICE candidates
    const processPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
        if (!pc.remoteDescription) return;

        console.log(`🧊 Processing ${pendingIceCandidates.current.length} queued ICE candidates`);
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
    }, []);

    // Create and send offer (caller)
    const createOffer = useCallback(async () => {
        if (!socket || !targetUserId) return;

        console.log('🚀 Initiating WebRTC handshake (Caller)');
        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            console.log('➕ Adding track to PC:', track.kind);
            pc.addTrack(track, stream);
        });

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('📤 Local description (offer) set, emitting to signaling server');

            socket.emit('webrtc-offer', {
                targetUserId,
                offer: pc.localDescription
            });
        } catch (error) {
            console.error('❌ Failed to create/set offer:', error);
        }
    }, [socket, targetUserId, createPeerConnection, initializeStream]);

    // Handle incoming offer and create answer (receiver)
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, callerId: string) => {
        if (!socket) return;

        console.log('🚀 Responding to WebRTC offer (Receiver)');
        const pc = createPeerConnection();
        const stream = await initializeStream();

        stream.getTracks().forEach(track => {
            console.log('➕ Adding track to PC:', track.kind);
            pc.addTrack(track, stream);
        });

        try {
            console.log('📥 Setting remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Now that remote description is set, we can process candidates
            await processPendingIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('📤 Local description (answer) set, emitting to signaling server');

            socket.emit('webrtc-answer', {
                targetUserId: callerId,
                answer: pc.localDescription
            });
        } catch (error) {
            console.error('❌ Failed to handle offer/create answer:', error);
        }
    }, [socket, createPeerConnection, initializeStream, processPendingIceCandidates]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) {
            console.warn('⚠️ Received answer but peer connection does not exist');
            return;
        }

        try {
            console.log('📥 Setting remote description (answer)');
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Now that remote description is set, we can process candidates
            await processPendingIceCandidates(pc);
        } catch (error) {
            console.error('❌ Failed to set remote description (answer):', error);
        }
    }, [processPendingIceCandidates]);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;

        if (!pc || !pc.remoteDescription) {
            console.log('🧊 ICE candidate received before PC/remote desc ready, queueing...');
            pendingIceCandidates.current.push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('🧊 Remote ICE candidate added directly');
        } catch (error) {
            console.error('❌ Failed to add ICE candidate:', error);
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
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        console.log('🧹 Cleaning up WebRTC resources');
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
            console.log('📶 Signaling: ice-candidate received');
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
