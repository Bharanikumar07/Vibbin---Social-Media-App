// Video Call Types

export type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface CallerInfo {
    id: string;
    name: string;
    username: string;
    profilePicture: string | null;
}

export interface IncomingCallData {
    callerId: string;
    callerInfo: CallerInfo;
}

export interface CallEndedData {
    endedBy: string;
    duration?: number;
    reason?: string;
}

export interface VideoCallState {
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    targetUserId: string | null;
    targetUserInfo: CallerInfo | null;
    incomingCall: IncomingCallData | null;
    isMuted: boolean;
    isCameraOff: boolean;
    callDuration: number;
    error: string | null;
}

export interface VideoCallActions {
    startCall: (targetUserId: string, targetUserInfo: CallerInfo) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    resetCall: () => void;
}

export interface VideoCallContextType extends VideoCallState, VideoCallActions { }

// WebRTC Configuration - Robust set of STUN and free TURN servers
export const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        // Community free TURN relay (OpenRelay)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10,
};

// Media Constraints
export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
    video: {
        width: { ideal: 640 }, // Lowering ideal resolution for better stability on unstable networks
        height: { ideal: 360 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

// Call timeout duration (45 seconds - giving a bit more time for handshake)
export const CALL_TIMEOUT_MS = 45000;
