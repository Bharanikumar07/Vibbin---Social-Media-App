# 🎥 Video Call Feature Implementation Plan

## System Architecture Overview

Based on the WebRTC architecture diagram, the video call feature will implement a **peer-to-peer (P2P) video calling system** using WebRTC with the following components:

```
┌─────────────────────┐                    ┌─────────────────────┐
│    HOME CLIENT      │                    │    AWAY CLIENT      │
│  (Caller/Callee)    │                    │  (Caller/Callee)    │
├─────────────────────┤                    ├─────────────────────┤
│                     │                    │                     │
│  Video Source       │                    │  Video Source       │
│  (Camera 800x600)   │                    │  (Camera 1024x768)  │
│         │           │                    │         │           │
│         ▼           │                    │         ▼           │
│  ┌─────────────┐    │                    │  ┌─────────────┐    │
│  │ Video Sinks │    │                    │  │ Video Sinks │    │
│  │ A: 1920x1200│    │                    │  │ Y: 150x100  │    │
│  │ B: 320x200  │    │                    │  │ Z: 1024x768 │    │
│  └─────────────┘    │                    │  └─────────────┘    │
│         │           │                    │         │           │
│         ▼           │                    │         ▼           │
│  RTCPeerConnection ◄├────────────────────┤► RTCPeerConnection  │
│                     │    ICE Candidates  │                     │
│                     │    SDP Offer/Answer│                     │
└─────────────────────┘                    └─────────────────────┘
                      │                    │
                      └────────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SIGNALING SERVER  │
                    │   (Socket.IO)       │
                    │   - Call initiation │
                    │   - ICE exchange    │
                    │   - SDP exchange    │
                    └─────────────────────┘
```

---

## 📁 File Structure

### Client Side (React + TypeScript)
```
client/src/
├── components/
│   ├── VideoCall/
│   │   ├── VideoCallModal.tsx       # Main video call UI component
│   │   ├── VideoCallControls.tsx    # Mute, camera, end call buttons
│   │   ├── LocalVideo.tsx           # Self-view video element
│   │   ├── RemoteVideo.tsx          # Peer video element
│   │   └── IncomingCallModal.tsx    # Incoming call notification
│   └── ...
├── context/
│   ├── VideoCallContext.tsx         # Global video call state management
│   └── ...
├── hooks/
│   ├── useWebRTC.ts                 # WebRTC peer connection logic
│   ├── useMediaDevices.ts           # Camera/mic access
│   └── ...
├── utils/
│   ├── webrtc.ts                    # WebRTC helper functions
│   └── ...
└── pages/
    └── MessagesPage.tsx             # Updated with video call button
```

### Server Side (Node.js + Express + Socket.IO)
```
server/src/
├── routes/
│   └── videocall.ts                 # Video call API routes (call logs)
├── utils/
│   └── videocall.ts                 # Video call utilities
└── index.ts                         # Updated socket handlers
```

### Database Schema (Prisma)
```prisma
model VideoCall {
  id          String    @id @default(cuid())
  callerId    String
  receiverId  String
  status      CallStatus @default(INITIATED)
  startedAt   DateTime?
  endedAt     DateTime?
  duration    Int?      // in seconds
  createdAt   DateTime  @default(now())
  
  caller      User      @relation("CallerCalls", fields: [callerId], references: [id])
  receiver    User      @relation("ReceiverCalls", fields: [receiverId], references: [id])
}

enum CallStatus {
  INITIATED
  RINGING
  ANSWERED
  ENDED
  MISSED
  REJECTED
  FAILED
}
```

---

## 🔧 Implementation Steps

### Phase 1: Database & Backend Setup

#### Step 1.1: Update Prisma Schema
Add the `VideoCall` model to track call history.

#### Step 1.2: Create Video Call Routes
```typescript
// server/src/routes/videocall.ts
- GET /api/videocall/history       # Get call history
- POST /api/videocall/log          # Log a completed call
```

#### Step 1.3: Add Socket.IO Events for Signaling
```typescript
// Socket events to add in server/src/index.ts
socket.on('call:initiate', handleCallInitiate);      // Start a call
socket.on('call:accept', handleCallAccept);          // Accept incoming call
socket.on('call:reject', handleCallReject);          // Reject incoming call
socket.on('call:end', handleCallEnd);                // End ongoing call
socket.on('call:ice-candidate', handleIceCandidate); // ICE candidate exchange
socket.on('call:offer', handleOffer);                // SDP offer
socket.on('call:answer', handleAnswer);              // SDP answer
```

---

### Phase 2: Client-Side WebRTC Implementation

#### Step 2.1: Create WebRTC Hook
```typescript
// client/src/hooks/useWebRTC.ts
export const useWebRTC = () => {
  // Manage RTCPeerConnection
  // Handle ICE candidates
  // Handle SDP offer/answer
  // Manage local/remote streams
};
```

#### Step 2.2: Create Media Devices Hook
```typescript
// client/src/hooks/useMediaDevices.ts
export const useMediaDevices = () => {
  // Request camera/microphone access
  // Handle device switching
  // Manage stream constraints (resolution settings as shown in diagram)
};
```

#### Step 2.3: Create Video Call Context
```typescript
// client/src/context/VideoCallContext.tsx
// Global state for:
// - Current call status
// - Incoming call data
// - Active call data
// - Local/remote streams
```

---

### Phase 3: UI Components

#### Step 3.1: Video Call Modal
- Full-screen or modal video interface
- Picture-in-picture for self-view
- Remote video as main view
- Call duration timer

#### Step 3.2: Video Call Controls
- 🎤 Mute/Unmute microphone
- 📹 Enable/Disable camera
- 🔄 Switch camera (front/back on mobile)
- 📞 End call
- 🔊 Speaker toggle

#### Step 3.3: Incoming Call Modal
- Caller info display
- Accept/Reject buttons
- Ringtone audio

---

### Phase 4: Integration

#### Step 4.1: Add Video Call Button to MessagesPage
- Add call button in chat header
- Only show for online friends

#### Step 4.2: Add Video Call Button to ProfilePage
- Add "Video Call" option for friends

#### Step 4.3: Global Call Notification
- Handle incoming calls from any page
- Wrap app with VideoCallContext

---

## 🔌 WebRTC Configuration

### ICE Servers (STUN/TURN)
```typescript
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN servers for NAT traversal in production
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

### Media Constraints (Based on Diagram)
```typescript
// Standard quality
const standardConstraints = {
  video: { width: 800, height: 600 },
  audio: true
};

// HD quality
const hdConstraints = {
  video: { width: 1920, height: 1200 },
  audio: true
};

// Mobile/low bandwidth
const lowConstraints = {
  video: { width: 320, height: 200 },
  audio: true
};
```

---

## 📱 Call Flow Sequence

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Caller  │                    │ Server  │                    │ Receiver│
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │  1. call:initiate            │                              │
     │─────────────────────────────►│                              │
     │                              │  2. call:incoming            │
     │                              │─────────────────────────────►│
     │                              │                              │
     │                              │  3. call:accept              │
     │                              │◄─────────────────────────────│
     │  4. call:accepted            │                              │
     │◄─────────────────────────────│                              │
     │                              │                              │
     │  5. call:offer (SDP)         │                              │
     │─────────────────────────────►│                              │
     │                              │  6. call:offer (SDP)         │
     │                              │─────────────────────────────►│
     │                              │                              │
     │                              │  7. call:answer (SDP)        │
     │                              │◄─────────────────────────────│
     │  8. call:answer (SDP)        │                              │
     │◄─────────────────────────────│                              │
     │                              │                              │
     │  9. ICE Candidates Exchange  │                              │
     │◄────────────────────────────►│◄────────────────────────────►│
     │                              │                              │
     │  ═══════ P2P Connection Established ═══════                 │
     │◄───────────────────────────────────────────────────────────►│
     │                              │                              │
```

---

## 🎨 UI Design Mockup

### Video Call Screen
```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  │                                  │    │
│  │         REMOTE VIDEO             │    │
│  │         (Full Screen)            │    │
│  │                                  │    │
│  │                                  │    │
│  │                          ┌─────┐ │    │
│  │                          │LOCAL│ │    │
│  │                          │VIDEO│ │    │
│  │                          └─────┘ │    │
│  └──────────────────────────────────┘    │
│                                          │
│        John Doe • 02:34                  │
│                                          │
│    ┌────┐  ┌────┐  ┌────┐  ┌────┐       │
│    │ 🎤 │  │ 📹 │  │ 🔄 │  │ 📞 │       │
│    │Mute│  │ Cam│  │Flip│  │ End│       │
│    └────┘  └────┘  └────┘  └────┘       │
└──────────────────────────────────────────┘
```

### Incoming Call Modal
```
┌────────────────────────────────┐
│                                │
│         ┌──────────┐           │
│         │  Avatar  │           │
│         └──────────┘           │
│                                │
│        Incoming Video Call     │
│           John Doe             │
│                                │
│    ┌──────────┐ ┌──────────┐   │
│    │  ❌      │ │    ✅    │   │
│    │ Decline  │ │  Accept  │   │
│    └──────────┘ └──────────┘   │
│                                │
└────────────────────────────────┘
```

---

## 📦 Dependencies to Install

### Client
```bash
# No additional dependencies needed - WebRTC is built into browsers
# Optional: for advanced features
npm install simple-peer  # Simplified WebRTC wrapper (optional)
```

### Server
```bash
# Socket.IO is already installed
# No additional dependencies needed for signaling
```

---

## ⚡ Performance Considerations

1. **Adaptive Bitrate**: Adjust video quality based on network conditions
2. **Resolution Switching**: Support multiple resolutions as shown in the architecture (320x200, 800x600, 1024x768, 1920x1200)
3. **Bandwidth Detection**: Auto-select quality based on connection speed
4. **Fallback to Audio**: Option to disable video on poor connections

---

## 🔒 Security Considerations

1. **Friend-only Calls**: Only allow calls between friends
2. **DTLS-SRTP**: WebRTC encrypts media streams by default
3. **Secure Signaling**: Use authenticated socket connections
4. **Call Permissions**: Request camera/mic only when needed

---

## 🚀 Ready to Implement?

Would you like me to start implementing the video call feature? I suggest this order:

1. **First**: Update Prisma schema and create database migration
2. **Second**: Add signaling events to the Socket.IO server
3. **Third**: Create the WebRTC hooks and context on the client
4. **Fourth**: Build the UI components (VideoCallModal, IncomingCallModal, Controls)
5. **Fifth**: Integrate with MessagesPage and ProfilePage

Let me know and I'll begin the implementation! 🎬
