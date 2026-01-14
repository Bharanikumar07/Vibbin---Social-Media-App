import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            include: {
                sender: { select: { id: true, name: true, username: true, profilePicture: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req: any, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: req.params.id, userId: req.user.id },
            data: { read: true }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Mark all as read
router.patch('/read-all', authenticateToken, async (req: any, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        await prisma.notification.delete({
            where: { id: req.params.id, userId: req.user.id }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;
