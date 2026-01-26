import { Server, Socket } from 'socket.io';
import prisma from '../prisma';

// Track active calls: callerId -> { receiverId, status, startTime }
const activeCalls = new Map<string, { receiverId: string; status: string; startTime?: Date }>();

interface CallData {
    targetUserId: string;
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

        // When user joins, map their socket and join room
        socket.on('join', (userId: string) => {
            currentUserId = userId;
            socket.join(userId);
            console.log(`📹 Video Call: User ${userId} joined room ${userId} (Socket: ${socket.id})`);
        });

        // ==================== CALL SIGNALING ====================

        // Initiate a call
        socket.on('call-user', async (data: CallData) => {
            if (!currentUserId) {
                console.error('⚠️ call-user: Not authenticated');
                socket.emit('call-error', { message: 'Not authenticated' });
                return;
            }

            const { targetUserId } = data;
            console.log(`📞 Signaling: call-user from ${currentUserId} to ${targetUserId}`);

            try {
                // Verify friendship
                const friendship = await prisma.friendship.findFirst({
                    where: { userId: currentUserId, friendId: targetUserId }
                });

                if (!friendship) {
                    console.warn(`⚠️ call-user: Users ${currentUserId} and ${targetUserId} are not friends`);
                    socket.emit('call-error', { message: 'You can only call friends' });
                    return;
                }

                // Check if target user is online
                const targetUser = await prisma.user.findUnique({
                    where: { id: targetUserId },
                    select: { isOnline: true }
                });

                if (!targetUser?.isOnline) {
                    console.warn(`⚠️ call-user: Target user ${targetUserId} is offline`);
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

                // Notify the target user
                console.log(`📤 Emitting incoming-call to ${targetUserId}`);
                io.to(targetUserId).emit('incoming-call', {
                    callerId: currentUserId,
                    callerInfo: caller
                });

                // Confirm to caller that call is ringing
                socket.emit('call-ringing', { targetUserId });

            } catch (error) {
                console.error('❌ Call initiation error:', error);
                socket.emit('call-error', { message: 'Failed to initiate call' });
            }
        });

        // Accept incoming call
        socket.on('accept-call', async (data: { callerId: string }) => {
            if (!currentUserId) return;

            const { callerId } = data;
            console.log(`✅ Signaling: accept-call by ${currentUserId} for caller ${callerId}`);

            const call = activeCalls.get(callerId);
            if (call && call.receiverId === currentUserId) {
                call.status = 'connected';
                call.startTime = new Date();
                activeCalls.set(callerId, call);

                // Notify the caller that call was accepted
                console.log(`📤 Emitting call-accepted to ${callerId}`);
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
                    console.error('❌ Failed to log call:', error);
                }
            } else {
                console.warn(`⚠️ accept-call: No active call found for caller ${callerId} targetted at ${currentUserId}`);
            }
        });

        // Reject incoming call
        socket.on('reject-call', async (data: { callerId: string }) => {
            if (!currentUserId) return;

            const { callerId } = data;
            console.log(`❌ Signaling: reject-call by ${currentUserId} for caller ${callerId}`);

            const call = activeCalls.get(callerId);
            if (call && call.receiverId === currentUserId) {
                activeCalls.delete(callerId);

                // Notify the caller
                console.log(`📤 Emitting call-rejected to ${callerId}`);
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
                    console.error('❌ Failed to log rejected call:', error);
                }
            }
        });

        // End call
        socket.on('end-call', async (data: { targetUserId: string }) => {
            if (!currentUserId) return;

            const { targetUserId } = data;
            console.log(`📴 Signaling: end-call by ${currentUserId} with target ${targetUserId}`);

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

                // Notify both parties
                console.log(`📤 Emitting call-ended to ${targetUserId}`);
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
                    console.error('❌ Failed to update call log:', error);
                }
            }
        });

        // ==================== WEBRTC SIGNALING ====================

        // Forward WebRTC offer
        socket.on('webrtc-offer', (data: SignalingData) => {
            if (!currentUserId) return;

            console.log(`📡 signaling: webrtc-offer from ${currentUserId} to ${data.targetUserId}`);

            io.to(data.targetUserId).emit('webrtc-offer', {
                offer: data.offer,
                callerId: currentUserId
            });
        });

        // Forward WebRTC answer
        socket.on('webrtc-answer', (data: SignalingData) => {
            if (!currentUserId) return;

            console.log(`📡 signaling: webrtc-answer from ${currentUserId} to ${data.targetUserId}`);

            io.to(data.targetUserId).emit('webrtc-answer', {
                answer: data.answer,
                answererId: currentUserId
            });
        });

        // Forward ICE candidate
        socket.on('ice-candidate', (data: SignalingData) => {
            if (!currentUserId) return;

            console.log(`🧊 signaling: ice-candidate from ${currentUserId} to ${data.targetUserId}`);

            io.to(data.targetUserId).emit('ice-candidate', {
                candidate: data.candidate,
                senderId: currentUserId
            });
        });

        // ==================== CLEANUP ====================

        socket.on('disconnect', async () => {
            if (currentUserId) {
                console.log(`📹 Video Call: Socket ${socket.id} for user ${currentUserId} disconnected`);

                // Use a local copy of userId to avoid closure issues
                const userIdToClean = currentUserId;

                // Wait briefly to see if it's a transient reconnection (common on mobile)
                setTimeout(async () => {
                    try {
                        // Check if user has any other active sockets in their private room
                        const remainingSockets = await io.in(userIdToClean).fetchSockets();

                        if (remainingSockets.length === 0) {
                            console.log(`📴 User ${userIdToClean} is truly offline. Cleaning up active calls.`);

                            // Clean up as caller
                            const call = activeCalls.get(userIdToClean);
                            if (call) {
                                io.to(call.receiverId).emit('call-ended', {
                                    endedBy: userIdToClean,
                                    reason: 'disconnect'
                                });
                                activeCalls.delete(userIdToClean);
                            }

                            // Clean up as receiver
                            for (const [callerId, callData] of activeCalls.entries()) {
                                if (callData.receiverId === userIdToClean) {
                                    io.to(callerId).emit('call-ended', {
                                        endedBy: userIdToClean,
                                        reason: 'disconnect'
                                    });
                                    activeCalls.delete(callerId);
                                }
                            }
                        } else {
                            console.log(`✅ User ${userIdToClean} still has ${remainingSockets.length} sockets active. Call maintained.`);
                        }
                    } catch (error) {
                        console.error('❌ Error during disconnect cleanup:', error);
                    }
                }, 3000); // 3 second grace period for reconnection
            }
        });
    });
};
