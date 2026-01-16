import prisma from '../prisma';
import { Server } from 'socket.io';


export type NotificationType = 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'MESSAGE' | 'POST_LIKE' | 'COMMENT' | 'STORY_LIKE';

interface CreateNotificationParams {
    userId: string;
    fromId: string;
    type: NotificationType;
    content: string;
    targetId?: string;
    io: Server;
}

export const createNotification = async ({
    userId,
    fromId,
    type,
    content,
    targetId,
    io
}: CreateNotificationParams) => {
    try {
        // Don't send notification to self
        if (userId === fromId) {
            return null;
        }

        // Create notification in database
        const notification = await prisma.notification.create({
            data: {
                userId,
                fromId,
                type,
                content,
                targetId,
                read: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        profilePicture: true
                    }
                }
            }
        });

        // Emit real-time notification to the user
        io.to(userId).emit('notification:new', {
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            content: notification.content,
            targetId: notification.targetId,
            read: notification.read,
            createdAt: notification.createdAt,
            sender: notification.sender
        });

        console.log(`📬 Notification sent to ${userId}: ${type}`);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};
