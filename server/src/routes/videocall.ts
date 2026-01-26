import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get call history
router.get('/history', authenticateToken, async (req: any, res, next) => {
    try {
        const userId = req.user.id;

        const calls = await prisma.videoCall.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                caller: { select: { id: true, name: true, username: true, profilePicture: true } },
                receiver: { select: { id: true, name: true, username: true, profilePicture: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(calls);
    } catch (error) {
        next(error);
    }
});

// Log a call
router.post('/log', authenticateToken, async (req: any, res, next) => {
    try {
        const { receiverId, status, startedAt, endedAt, duration } = req.body;
        const callerId = req.user.id;

        // Verify friendship
        const friendship = await prisma.friendship.findFirst({
            where: { userId: callerId, friendId: receiverId }
        });

        if (!friendship) {
            return res.status(403).json({ error: 'You can only call friends' });
        }

        const call = await prisma.videoCall.create({
            data: {
                callerId,
                receiverId,
                status,
                startedAt: startedAt ? new Date(startedAt) : null,
                endedAt: endedAt ? new Date(endedAt) : null,
                duration
            },
            include: {
                caller: { select: { id: true, name: true, username: true, profilePicture: true } },
                receiver: { select: { id: true, name: true, username: true, profilePicture: true } }
            }
        });

        res.status(201).json(call);
    } catch (error) {
        next(error);
    }
});

// Update call status
router.patch('/:callId', authenticateToken, async (req: any, res, next) => {
    try {
        const { callId } = req.params;
        const { status, endedAt, duration } = req.body;
        const userId = req.user.id;

        const call = await prisma.videoCall.findUnique({
            where: { id: callId }
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        if (call.callerId !== userId && call.receiverId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updatedCall = await prisma.videoCall.update({
            where: { id: callId },
            data: {
                status,
                endedAt: endedAt ? new Date(endedAt) : undefined,
                duration
            }
        });

        res.json(updatedCall);
    } catch (error) {
        next(error);
    }
});

export default router;
