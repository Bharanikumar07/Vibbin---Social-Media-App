import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { createNotification } from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// Search users
router.get('/search', authenticateToken, async (req: any, res, next) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: String(q) } },
                    { name: { contains: String(q) } }
                ],
                NOT: { id: currentUserId },
            },
            select: { id: true, name: true, username: true, profilePicture: true, bio: true },
        });

        // Enrich with friendship status
        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const friendship = await prisma.friendship.findFirst({
                where: { userId: currentUserId, friendId: u.id }
            });

            const request = await prisma.friendRequest.findFirst({
                where: {
                    OR: [
                        { fromUserId: currentUserId, toUserId: u.id, status: 'pending' },
                        { fromUserId: u.id, toUserId: currentUserId, status: 'pending' }
                    ]
                }
            });

            return {
                ...u,
                isFriend: !!friendship,
                pendingRequest: !!request,
                requestSent: request?.fromUserId === currentUserId
            };
        }));

        res.json(enrichedUsers);
    } catch (error) {
        next(error);
    }
});

// Get user profile by username
router.get('/profile/:username', authenticateToken, async (req: any, res, next) => {
    try {
        const { username } = req.params;
        const userId = req.user.id;

        const profile = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                profilePicture: true,
                isOnline: true,
                lastSeen: true,
                _count: {
                    select: {
                        friends: true,
                        posts: true
                    }
                }
            }
        });

        if (!profile) return res.status(404).json({ error: 'User not found' });

        // Check relationship status
        const isFriend = await prisma.friendship.findFirst({
            where: { userId, friendId: profile.id }
        });

        const pendingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { fromUserId: userId, toUserId: profile.id, status: 'pending' },
                    { fromUserId: profile.id, toUserId: userId, status: 'pending' }
                ]
            }
        });

        res.json({
            ...profile,
            isFriend: !!isFriend,
            requestStatus: pendingRequest ? (pendingRequest.fromUserId === userId ? 'sent' : 'received') : 'none',
            requestId: pendingRequest?.id
        });
    } catch (error) {
        next(error);
    }
});

// Send friend request
router.post('/request', authenticateToken, async (req: any, res, next) => {
    try {
        const { toUserId } = req.body;
        const fromUserId = req.user.id;

        console.log(`Friend request attempt: from ${fromUserId} to ${toUserId}`);

        if (!toUserId) {
            return res.status(400).json({ error: 'Receiver user ID is required' });
        }

        if (toUserId === fromUserId) {
            return res.status(400).json({ error: 'Cannot add yourself' });
        }

        // 1. Verify receiver exists
        const targetUser = await prisma.user.findUnique({
            where: { id: toUserId },
            select: { id: true, username: true }
        });

        if (!targetUser) {
            console.error(`Target user ${toUserId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Check if already friends
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: fromUserId, friendId: toUserId },
                    { userId: toUserId, friendId: fromUserId }
                ]
            }
        });

        if (existingFriendship) {
            return res.status(400).json({ error: 'You are already friends' });
        }

        // 3. Check for existing pending request (either way)
        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { fromUserId, toUserId, status: 'pending' },
                    { fromUserId: toUserId, toUserId: fromUserId, status: 'pending' }
                ]
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                error: existingRequest.fromUserId === fromUserId
                    ? 'Friend request already sent'
                    : 'A friend request from this user is already pending'
            });
        }

        // 4. Create the request
        const request = await prisma.friendRequest.create({
            data: { fromUserId, toUserId },
        });

        console.log(`Friend request created: ${request.id}`);

        // 5. Send real-time notification
        // Use username from req.user if available, otherwise fetch it
        let senderUsername = req.user.username;
        if (!senderUsername) {
            const sender = await prisma.user.findUnique({ where: { id: fromUserId }, select: { username: true } });
            senderUsername = sender?.username || 'Someone';
        }

        await createNotification({
            userId: toUserId,
            fromId: fromUserId,
            type: 'FRIEND_REQUEST',
            content: `${senderUsername} sent you a friend request`,
            targetId: request.id,
            io: req.io
        });

        res.status(201).json(request);
    } catch (error: any) {
        // Handle PostgreSQL unique constraint or other DB errors
        next(error);
    }
});

// Get pending requests
router.get('/requests', authenticateToken, async (req: any, res, next) => {
    try {
        const requests = await prisma.friendRequest.findMany({
            where: { toUserId: req.user.id, status: 'pending' },
            include: { fromUser: { select: { id: true, name: true, username: true, profilePicture: true } } },
        });
        res.json(requests);
    } catch (error) {
        next(error);
    }
});

// Accept/Reject request
router.post('/request/:id/respond', authenticateToken, async (req: any, res, next) => {
    try {
        const { status } = req.body; // accepted or rejected
        const { id } = req.params;

        // Check if the request exists and is still pending
        const existingRequest = await prisma.friendRequest.findUnique({
            where: { id }
        });

        if (!existingRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        if (existingRequest.status !== 'pending') {
            return res.status(400).json({ error: 'Friend request has already been responded to' });
        }

        const request = await prisma.friendRequest.update({
            where: { id },
            data: { status },
        });

        if (status === 'accepted') {
            // Check if friendship already exists
            const existingFriendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { userId: request.fromUserId, friendId: request.toUserId },
                        { userId: request.toUserId, friendId: request.fromUserId }
                    ]
                }
            });

            // Only create friendships if they don't exist
            if (!existingFriendship) {
                await prisma.friendship.createMany({
                    data: [
                        { userId: request.fromUserId, friendId: request.toUserId },
                        { userId: request.toUserId, friendId: request.fromUserId },
                    ],
                });
            }

            // Send real-time notification
            await createNotification({
                userId: request.fromUserId,
                fromId: request.toUserId,
                type: 'FRIEND_ACCEPTED',
                content: `${req.user.username} accepted your friend request`,
                io: req.io
            });
        }

        res.json(request);
    } catch (error: any) {
        next(error);
    }
});

// Get Friends List
router.get('/', authenticateToken, async (req: any, res, next) => {
    try {
        const friendships = await prisma.friendship.findMany({
            where: { userId: req.user.id },
            include: {
                friend: {
                    select: { id: true, name: true, username: true, profilePicture: true, bio: true }
                }
            }
        });
        const friends = friendships.map(f => f.friend);
        res.json(friends);
    } catch (error) {
        next(error);
    }
});

export default router;
