import { Server, Socket } from 'socket.io';
import prisma from '../prisma';

// Track active calls: callerId -> { receiverId, status, startTime }
const activeCalls = new Map<string, { receiverId: string; status: string; startTime?: Date }>();

// Track socket to user mapping
const userSockets = new Map<string, string>(); // socketId -> userId

interface CallData {
    targetUserId: string;
    callerInfo?: {
        id: string;
        name: string;
        username: string;
        profilePicture: string | null;
    };
}

interface SignalingData {
    targetUserId: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

export const setupVideoCallSignaling = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        let currentUserId: string | null = null;

        // When user joins, map their socket
        socket.on('join', (userId: string) => {
            currentUserId = userId;
            userSockets.set(socket.id, userId);
            console.log(`📹 Video Call: User ${userId} connected with socket ${socket.id}`);
        });

        // ==================== CALL SIGNALING ====================

        // Initiate a call
        socket.on('call-user', async (data: CallData) => {
            if (!currentUserId) {
                socket.emit('call-error', { message: 'Not authenticated' });
                return;
            }

            const { targetUserId } = data;

            try {
                // Verify friendship
                const friendship = await prisma.friendship.findFirst({
                    where: { userId: currentUserId, friendId: targetUserId }
                });

                if (!friendship) {
                    socket.emit('call-error', { message: 'You can only call friends' });
                    return;
                }

                // Check if target user is online
                const targetUser = await prisma.user.findUnique({
                    where: { id: targetUserId },
                    select: { isOnline: true }
                });

                if (!targetUser?.isOnline) {
                    socket.emit('call-error', { message: 'User is offline' });
                    return;
                }

                // Get caller info
                const caller = await prisma.user.findUnique({
                    where: { id: currentUserId },
                    select: { id: true, name: true, username: true, profilePicture: true }
                });

                // Track the call
                activeCalls.set(currentUserId, { receiverId: targetUserId, status: 'calling' });

                console.log(`📞 Call initiated: ${currentUserId} -> ${targetUserId}`);

                // Notify the target user
                io.to(targetUserId).emit('incoming-call', {
                    callerId: currentUserId,
                    callerInfo: caller
                });

                // Confirm to caller that call is ringing
                socket.emit('call-ringing', { targetUserId });

            } catch (error) {
                console.error('Call initiation error:', error);
                socket.emit('call-error', { message: 'Failed to initiate call' });
            }
        });

        // Accept incoming call
        socket.on('accept-call', async (data: { callerId: string }) => {
            if (!currentUserId) return;

            const { callerId } = data;
            const call = activeCalls.get(callerId);

            if (call && call.receiverId === currentUserId) {
                call.status = 'connected';
                call.startTime = new Date();
                activeCalls.set(callerId, call);

                console.log(`✅ Call accepted: ${callerId} <-> ${currentUserId}`);

                // Notify the caller that call was accepted
                io.to(callerId).emit('call-accepted', { acceptedBy: currentUserId });

                // Log the call in database
                try {
                    await prisma.videoCall.create({
                        data: {
                            callerId,
                            receiverId: currentUserId,
                            status: 'ANSWERED',
                            startedAt: new Date()
                        }
                    });
                } catch (error) {
                    console.error('Failed to log call:', error);
                }
            }
        });

        // Reject incoming call
        socket.on('reject-call', async (data: { callerId: string }) => {
            if (!currentUserId) return;

            const { callerId } = data;
            const call = activeCalls.get(callerId);

            if (call && call.receiverId === currentUserId) {
                activeCalls.delete(callerId);

                console.log(`❌ Call rejected: ${callerId} -> ${currentUserId}`);

                // Notify the caller
                io.to(callerId).emit('call-rejected', { rejectedBy: currentUserId });

                // Log the rejected call
                try {
                    await prisma.videoCall.create({
                        data: {
                            callerId,
                            receiverId: currentUserId,
                            status: 'REJECTED'
                        }
                    });
                } catch (error) {
                    console.error('Failed to log rejected call:', error);
                }
            }
        });

        // End call
        socket.on('end-call', async (data: { targetUserId: string }) => {
            if (!currentUserId) return;

            const { targetUserId } = data;

            // Check if current user is caller or receiver
            let call = activeCalls.get(currentUserId);
            let callerId = currentUserId;

            if (!call) {
                // Current user might be the receiver
                call = activeCalls.get(targetUserId);
                callerId = targetUserId;
            }

            if (call) {
                const duration = call.startTime
                    ? Math.floor((Date.now() - call.startTime.getTime()) / 1000)
                    : 0;

                activeCalls.delete(callerId);

                console.log(`📴 Call ended: ${callerId} <-> ${call.receiverId} (${duration}s)`);

                // Notify both parties
                io.to(targetUserId).emit('call-ended', { endedBy: currentUserId, duration });
                socket.emit('call-ended', { endedBy: currentUserId, duration });

                // Update call log
                try {
                    const existingCall = await prisma.videoCall.findFirst({
                        where: {
                            callerId,
                            receiverId: call.receiverId,
                            status: 'ANSWERED'
                        },
                        orderBy: { createdAt: 'desc' }
                    });

                    if (existingCall) {
                        await prisma.videoCall.update({
                            where: { id: existingCall.id },
                            data: {
                                status: 'ENDED',
                                endedAt: new Date(),
                                duration
                            }
                        });
                    }
                } catch (error) {
                    console.error('Failed to update call log:', error);
                }
            }
        });

        // ==================== WEBRTC SIGNALING ====================

        // Forward WebRTC offer
        socket.on('webrtc-offer', (data: SignalingData) => {
            if (!currentUserId) return;

            console.log(`🎥 WebRTC Offer: ${currentUserId} -> ${data.targetUserId}`);

            io.to(data.targetUserId).emit('webrtc-offer', {
                offer: data.offer,
                callerId: currentUserId
            });
        });

        // Forward WebRTC answer
        socket.on('webrtc-answer', (data: SignalingData) => {
            if (!currentUserId) return;

            console.log(`🎥 WebRTC Answer: ${currentUserId} -> ${data.targetUserId}`);

            io.to(data.targetUserId).emit('webrtc-answer', {
                answer: data.answer,
                answererId: currentUserId
            });
        });

        // Forward ICE candidate
        socket.on('ice-candidate', (data: SignalingData) => {
            if (!currentUserId) return;

            io.to(data.targetUserId).emit('ice-candidate', {
                candidate: data.candidate,
                senderId: currentUserId
            });
        });

        // ==================== CLEANUP ====================

        socket.on('disconnect', async () => {
            if (currentUserId) {
                // Clean up any active calls
                const call = activeCalls.get(currentUserId);
                if (call) {
                    io.to(call.receiverId).emit('call-ended', {
                        endedBy: currentUserId,
                        reason: 'disconnect'
                    });
                    activeCalls.delete(currentUserId);
                    console.log(`📴 Call ended due to disconnect: ${currentUserId}`);
                }

                // Check if current user was a receiver in any call
                for (const [callerId, callData] of activeCalls.entries()) {
                    if (callData.receiverId === currentUserId) {
                        io.to(callerId).emit('call-ended', {
                            endedBy: currentUserId,
                            reason: 'disconnect'
                        });
                        activeCalls.delete(callerId);
                        console.log(`📴 Call ended due to receiver disconnect: ${callerId}`);
                    }
                }

                userSockets.delete(socket.id);
                console.log(`📹 Video Call: User ${currentUserId} disconnected`);
            }
        });
    });
};

export { activeCalls, userSockets };
