import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadToSupabase } from '../utils/upload';
import { createNotification } from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// Get stories from friends
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const friendships = await prisma.friendship.findMany({
            where: { userId },
            select: { friendId: true },
        });
        const friendIds = friendships.map(f => f.friendId);
        const authorIds = [userId, ...friendIds];

        const stories = await prisma.story.findMany({
            where: {
                authorId: { in: authorIds },
                expiresAt: { gt: new Date() },
            },
            include: {
                author: { select: { id: true, name: true, username: true, profilePicture: true } },
                views: {
                    include: {
                        user: { select: { id: true, name: true, username: true, profilePicture: true } }
                    }
                },
                likes: {
                    include: {
                        user: { select: { id: true, name: true, username: true, profilePicture: true } }
                    }
                },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, username: true, profilePicture: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Create story
router.post('/', authenticateToken, upload.single('media'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image or video' });
        }

        let media = '';
        if (req.file) {
            media = await uploadToSupabase(req.file);
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = await prisma.story.create({
            data: {
                media,
                authorId: req.user.id,
                expiresAt,
            },
            include: {
                author: { select: { id: true, name: true, username: true, profilePicture: true } },
                views: true,
                likes: true,
                comments: true
            },
        });

        res.status(201).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// View story
router.post('/:storyId/view', authenticateToken, async (req: any, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        await prisma.storyView.upsert({
            where: {
                storyId_userId: { storyId, userId }
            },
            update: {
                viewedAt: new Date()
            },
            create: {
                storyId,
                userId
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Like story
router.post('/:storyId/like', authenticateToken, async (req: any, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        // Check if already liked, toggle like
        const existingLike = await prisma.storyLike.findUnique({
            where: { storyId_userId: { storyId, userId } }
        });

        if (existingLike) {
            await prisma.storyLike.delete({ where: { id: existingLike.id } });
            req.io.emit('story_updated', { storyId, type: 'unlike', userId });
            return res.json({ liked: false });
        }

        const like = await prisma.storyLike.create({
            data: { storyId, userId },
            include: {
                user: { select: { id: true, name: true, username: true, profilePicture: true } }
            }
        });

        // Notify author if not own story
        const story = await prisma.story.findUnique({ where: { id: storyId } });
        if (story && story.authorId !== userId) {
            await createNotification({
                userId: story.authorId,
                fromId: userId,
                type: 'STORY_LIKE',
                content: `${req.user.name || req.user.username} liked your story`,
                targetId: storyId,
                io: req.io
            });
        }

        req.io.emit('story_updated', { storyId, type: 'like', like });
        res.json({ liked: true, like });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Comment on story
router.post('/:storyId/comment', authenticateToken, async (req: any, res) => {
    try {
        const { storyId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ error: 'Comment required' });

        const comment = await prisma.storyComment.create({
            data: { storyId, userId, content },
            include: {
                user: { select: { id: true, name: true, username: true, profilePicture: true } }
            }
        });

        // Notify author if not own story
        const story = await prisma.story.findUnique({ where: { id: storyId } });
        if (story && story.authorId !== userId) {
            await createNotification({
                userId: story.authorId,
                fromId: userId,
                type: 'COMMENT', // Use generalized type or create specific if needed
                content: `${req.user.name || req.user.username} replied to your story: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`,
                targetId: storyId,
                io: req.io
            });
        }

        req.io.emit('story_updated', { storyId, type: 'comment', comment });
        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

export default router;
