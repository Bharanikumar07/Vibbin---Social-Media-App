import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadToSupabase } from '../utils/upload';
import { createNotification } from '../utils/notifications';

const router = Router();

// Get conversations list
router.get('/conversations', authenticateToken, async (req: any, res, next) => {
    try {
        const userId = req.user.id;

        // Find all users who have messaged or been messaged by the current user
        const sentMessages = await prisma.message.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });

        const receivedMessages = await prisma.message.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });

        const messagedUserIds = Array.from(new Set([
            ...sentMessages.map(m => m.receiverId),
            ...receivedMessages.map(m => m.senderId)
        ]));

        const conversations = await prisma.user.findMany({
            where: { id: { in: messagedUserIds } },
            select: { id: true, name: true, username: true, profilePicture: true },
        });

        // Get last message for each conversation
        const conversationList = await Promise.all(conversations.map(async (user) => {
            const lastMessage = await prisma.message.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: user.id },
                        { senderId: user.id, receiverId: userId },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
            return { ...user, lastMessage };
        }));

        res.json(conversationList.sort((a: any, b: any) =>
            (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0)
        ));
    } catch (error) {
        next(error);
    }
});

// Get messages for a specific user
router.get('/:userId', authenticateToken, async (req: any, res, next) => {
    try {
        const myId = req.user.id;
        const theirId = req.params.userId;

        // Check if friends
        const friendship = await prisma.friendship.findFirst({
            where: { userId: myId, friendId: theirId }
        });

        if (!friendship) {
            return res.status(403).json({ error: 'You must be friends to view these messages' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: theirId },
                    { senderId: theirId, receiverId: myId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// Send a message
router.post('/', authenticateToken, upload.single('image'), async (req: any, res, next) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        // Check if friends
        const friendship = await prisma.friendship.findFirst({
            where: { userId: senderId, friendId: receiverId }
        });

        if (!friendship) {
            return res.status(403).json({ error: 'You must be friends to message this user' });
        }

        const image = req.file ? await uploadToSupabase(req.file) : null;

        const message = await prisma.message.create({
            data: {
                content: content || '',
                senderId,
                receiverId,
                image
            },
            include: {
                sender: { select: { id: true, name: true, username: true, profilePicture: true } },
            },
        });

        // Emit via socket.io
        req.io.to(receiverId).emit('newMessage', message);
        req.io.to(senderId).emit('newMessage', message);

        // Send real-time notification
        await createNotification({
            userId: receiverId,
            fromId: senderId,
            type: 'MESSAGE',
            content: `${message.sender.name} sent you a message`,
            targetId: message.id,
            io: req.io
        });

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
});

// Mark messages as read
router.post('/read/:senderId', authenticateToken, async (req: any, res, next) => {
    try {
        const receiverId = req.user.id;
        const senderId = req.params.senderId;

        await prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: receiverId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        req.io.to(senderId).emit('messagesRead', { readerId: receiverId });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
