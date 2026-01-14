import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadToSupabase } from '../utils/upload';
import { createNotification } from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// Get feed (my posts + friends' posts)
router.get('/feed', authenticateToken, async (req: any, res, next) => {
    try {
        const userId = req.user.id;

        const friendships = await prisma.friendship.findMany({
            where: { userId: userId },
            select: { friendId: true },
        });

        const friendIds = friendships.map(f => f.friendId);
        const authorIds = [userId, ...friendIds];

        const posts = await prisma.post.findMany({
            where: { authorId: { in: authorIds } },
            include: {
                author: { select: { id: true, name: true, username: true, profilePicture: true } },
                likes: { select: { userId: true } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, username: true, profilePicture: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(posts);
    } catch (error) {
        next(error);
    }
});

// Create post
router.post('/', authenticateToken, upload.single('image'), async (req: any, res, next) => {
    try {
        const { content } = req.body;
        let image = null;

        if (req.file) {
            image = await uploadToSupabase(req.file);
        }

        const post = await prisma.post.create({
            data: {
                content,
                image,
                authorId: req.user.id,
            },
            include: {
                author: { select: { id: true, name: true, username: true, profilePicture: true } },
                likes: true,
                comments: true
            },
        });

        // Notify friends in real-time
        req.io.emit('newPost', post);

        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
});

// Like/Unlike post
router.post('/:postId/like', authenticateToken, async (req: any, res, next) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: { postId, userId }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id }
            });
            req.io.emit('postUpdate', { postId, type: 'unlike', userId });
            return res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: { postId, userId }
            });

            const post = await prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId !== userId) {
                await createNotification({
                    userId: post.authorId,
                    fromId: userId,
                    type: 'POST_LIKE',
                    content: `${req.user.name || req.user.username} liked your post`,
                    targetId: postId,
                    io: req.io
                });
            }

            req.io.emit('postUpdate', { postId, type: 'like', userId });
            return res.json({ liked: true });
        }
    } catch (error) {
        next(error);
    }
});

// Comment on post
router.post('/:postId/comment', authenticateToken, async (req: any, res, next) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                userId
            },
            include: {
                user: { select: { id: true, name: true, username: true, profilePicture: true } }
            }
        });

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post && post.authorId !== userId) {
            await createNotification({
                userId: post.authorId,
                fromId: userId,
                type: 'COMMENT',
                content: `${req.user.name || req.user.username} commented: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`,
                targetId: postId,
                io: req.io
            });
        }

        req.io.emit('postUpdate', { postId, type: 'comment', comment });
        res.status(201).json(comment);
    } catch (error) {
        next(error);
    }
});

// Get user's posts
router.get('/user/:username', authenticateToken, async (req: any, res, next) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const posts = await prisma.post.findMany({
            where: { authorId: user.id },
            include: {
                author: { select: { id: true, name: true, username: true, profilePicture: true } },
                likes: { select: { userId: true } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, username: true, profilePicture: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(posts);
    } catch (error) {
        next(error);
    }
});

// Delete post
router.delete('/:postId', authenticateToken, async (req: any, res, next) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        req.io.emit('postDeleted', { postId });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
