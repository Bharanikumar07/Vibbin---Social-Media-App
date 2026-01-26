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

// WebRTC Configuration - Just STUN for maximum stability/compatibility first
export const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10,
};

// Media Constraints - Lowering resolution significantly to ensure connection success
export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
    video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15, max: 20 },
        facingMode: 'user'
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

// Call timeout duration (60 seconds)
export const CALL_TIMEOUT_MS = 60000;
