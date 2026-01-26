import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import storyRoutes from './routes/stories';
import friendRoutes from './routes/friends';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import videoCallRoutes from './routes/videocall';
import { startCleanupJobs } from './utils/cleanup';
import { setupVideoCallSignaling } from './utils/videoCallSignaling';

dotenv.config();

// Architecture Check: Validate environment before anything else
if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL is not defined in environment variables.');
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
});

import prisma from './prisma';
const PORT = process.env.PORT || 5000;

// Middleware for Edge browser stability and security
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('src/uploads'));

// Inject socket.io into request
app.use((req: any, res, next) => {
    req.io = io;
    // Ensure responses are always identified as JSON for Edge compatibility
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/videocall', videoCallRoutes);

// 404 Handler for API - Express 5 compatible
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint not found' });
    } else {
        next();
    }
});

// Production-Grade Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER_ERROR:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Handle Prisma specific connection errors gracefully for users
    if (err.code === 'P2024') {
        return res.status(503).json({ error: 'Database connection timeout. Please try again.' });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred',
        code: err.code || 'INTERNAL_ERROR'
    });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    let currentUserId: string | null = null;

    socket.on('join', async (userId) => {
        try {
            currentUserId = userId;
            socket.join(userId);

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return;

            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: true }
            });

            const onlineUsers = await prisma.user.findMany({
                where: { isOnline: true },
                select: { id: true, isOnline: true, lastSeen: true }
            });

            socket.emit('initialOnlineUsers', onlineUsers);
            io.emit('userStatus', { userId, isOnline: true });
        } catch (error) {
            console.error('Socket Join Error:', error);
        }
    });

    socket.on('disconnect', async () => {
        if (currentUserId) {
            try {
                const user = await prisma.user.findUnique({ where: { id: currentUserId } });
                if (user) {
                    await prisma.user.update({
                        where: { id: currentUserId },
                        data: { isOnline: false, lastSeen: new Date() }
                    });
                    io.emit('userStatus', { userId: currentUserId, isOnline: false, lastSeen: new Date() });
                }
            } catch (error) {
                console.error('Socket Disconnect Error:', error);
            }
        }
    });

    socket.on('typing', ({ receiverId, isTyping }) => {
        io.to(receiverId).emit('userTyping', { userId: currentUserId, isTyping });
    });

    // ==================== VIDEO CALL SIGNALING ====================

    // Initiate a call
    socket.on('call-user', async (data: { targetUserId: string }) => {
        if (!currentUserId) {
            socket.emit('call-error', { message: 'Not authenticated' });
            return;
        }

        try {
            // Verify friendship
            const friendship = await prisma.friendship.findFirst({
                where: { userId: currentUserId, friendId: data.targetUserId }
            });

            if (!friendship) {
                socket.emit('call-error', { message: 'You can only call friends' });
                return;
            }

            // Get caller info
            const caller = await prisma.user.findUnique({
                where: { id: currentUserId },
                select: { id: true, name: true, username: true, profilePicture: true }
            });

            console.log(`📞 Call initiated: ${currentUserId} -> ${data.targetUserId}`);

            // Notify the target user
            io.to(data.targetUserId).emit('incoming-call', {
                callerId: currentUserId,
                callerInfo: caller
            });

            socket.emit('call-ringing', { targetUserId: data.targetUserId });
        } catch (error) {
            console.error('Call initiation error:', error);
            socket.emit('call-error', { message: 'Failed to initiate call' });
        }
    });

    // Accept incoming call
    socket.on('accept-call', (data: { callerId: string }) => {
        console.log(`✅ Call accepted: ${data.callerId} <-> ${currentUserId}`);
        io.to(data.callerId).emit('call-accepted', { acceptedBy: currentUserId });
    });

    // Reject incoming call
    socket.on('reject-call', (data: { callerId: string }) => {
        console.log(`❌ Call rejected: ${data.callerId} -> ${currentUserId}`);
        io.to(data.callerId).emit('call-rejected', { rejectedBy: currentUserId });
    });

    // End call
    socket.on('end-call', (data: { targetUserId: string }) => {
        console.log(`📴 Call ended: ${currentUserId} <-> ${data.targetUserId}`);
        io.to(data.targetUserId).emit('call-ended', { endedBy: currentUserId });
    });

    // Forward WebRTC offer
    socket.on('webrtc-offer', (data: { targetUserId: string; offer: any }) => {
        console.log(`🎥 WebRTC Offer: ${currentUserId} -> ${data.targetUserId}`);
        io.to(data.targetUserId).emit('webrtc-offer', {
            offer: data.offer,
            callerId: currentUserId
        });
    });

    // Forward WebRTC answer
    socket.on('webrtc-answer', (data: { targetUserId: string; answer: any }) => {
        console.log(`🎥 WebRTC Answer: ${currentUserId} -> ${data.targetUserId}`);
        io.to(data.targetUserId).emit('webrtc-answer', {
            answer: data.answer,
            answererId: currentUserId
        });
    });

    // Forward ICE candidate
    socket.on('ice-candidate', (data: { targetUserId: string; candidate: any }) => {
        io.to(data.targetUserId).emit('ice-candidate', {
            candidate: data.candidate,
            senderId: currentUserId
        });
    });
});

// Startup Handshake: Ensure PostgreSQL is ready before listening
const startServer = async () => {
    try {
        console.log('🚀 Connecting to PostgreSQL (Supabase)...');
        await prisma.$connect();
        console.log('✅ Database connection established.');

        // Reset all users to offline on server start
        await prisma.user.updateMany({
            data: { isOnline: false }
        });
        console.log('✅ User presence synchronized.');

        httpServer.listen(PORT, () => {
            console.log(`📡 Vibebin Backend active on port ${PORT} `);
            startCleanupJobs();
        });
    } catch (error) {
        console.error('❌ FATAL: Application failed to start due to database error.');
        console.error(error);
        process.exit(1);
    }
};

startServer();

export { prisma, io };
