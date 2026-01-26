import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const router = Router();

router.post('/signup', async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }] },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                username: normalizedUsername,
                email: normalizedEmail,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, process.env.JWT_SECRET || 'secret');

        res.status(201).json({ token, user: { id: user.id, name: user.name, username: user.username, email: user.email, profilePicture: user.profilePicture } });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive'
                }
            }
        });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, process.env.JWT_SECRET || 'secret');

        res.json({ token, user: { id: user.id, name: user.name, username: user.username, email: user.email, profilePicture: user.profilePicture } });
    } catch (error) {
        next(error);
    }
});

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res, next) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google token' });

        const normalizedEmail = payload.email.toLowerCase().trim();
        let user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive'
                }
            }
        });

        if (!user) {
            // Create user if not exists
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: payload.name || 'Google User',
                    username: normalizedEmail.split('@')[0] + Math.floor(Math.random() * 1000),
                    password: '', // No password for Google users
                    profilePicture: payload.picture,
                },
            });
        }

        const token = jwt.sign({ id: user.id, username: user.username, name: user.name }, process.env.JWT_SECRET || 'secret');
        res.json({ token, user: { id: user.id, name: user.name, username: user.username, email: user.email, profilePicture: user.profilePicture } });
    } catch (error) {
        next(error);
    }
});

import { authenticateToken } from '../middleware/auth';
import { upload, uploadToSupabase } from '../utils/upload';

router.put('/profile', authenticateToken, upload.single('profilePicture'), async (req: any, res, next) => {
    try {
        const { name, bio, theme, notificationSound } = req.body;
        const userId = req.user.id;
        let profilePicture = undefined;

        if (req.file) {
            profilePicture = await uploadToSupabase(req.file);
        }

        const dataToUpdate: any = {
            ...(name && { name }),
            ...(bio && { bio }),
            ...(profilePicture && { profilePicture }),
            ...(theme && { theme }),
            ...(notificationSound !== undefined && { notificationSound: notificationSound === 'true' || notificationSound === true })
        };

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
        });

        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            profilePicture: updatedUser.profilePicture,
            theme: updatedUser.theme,
            notificationSound: updatedUser.notificationSound
        });
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        });

        if (!user) {
            // Do not reveal if user exists
            return res.json({ message: 'If an account with that email exists, we sent you a reset link.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt
            }
        });

        const resetLink = `http://localhost:5173/reset-password/${token}`;
        const emailResult = await sendEmail(email, 'Password Reset - Vibebin', `Hi ${user.name},\n\nPlease click the link below to reset your password:\n${resetLink}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`);

        if (emailResult?.mock) {
            return res.json({ message: 'Development Mode: Check console or use this link.', link: resetLink });
        }

        res.json({ message: 'If an account with that email exists, we sent you a reset link.' });
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password/:token', async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        if (resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Token expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword }
        });

        // Delete the token
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
});

// Remove profile picture
router.delete('/profile/picture', authenticateToken, async (req: any, res, next) => {
    try {
        console.log('Remove profile picture request received for user:', req.user?.id);
        const userId = req.user.id;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePicture: null },
        });

        console.log('Profile picture removed successfully for user:', userId);

        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            profilePicture: updatedUser.profilePicture,
            theme: updatedUser.theme,
        });
    } catch (error) {
        next(error);
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: any, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                bio: true,
                profilePicture: true,
                theme: true,
                notificationSound: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

export default router;
