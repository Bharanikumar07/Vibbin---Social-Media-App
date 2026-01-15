import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Usage: npx ts-node src/deleteUser.ts <email_or_username>
const identifier = process.argv[2];

if (!identifier) {
    console.error('Please provide a username or email. Usage: npx ts-node src/deleteUser.ts <identifier>');
    process.exit(1);
}

async function deleteUser() {
    // Find the user first
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: { equals: identifier, mode: 'insensitive' } },
                { username: { equals: identifier, mode: 'insensitive' } }
            ]
        }
    });

    if (!user) {
        console.error(`User with identifier "${identifier}" not found.`);
        return;
    }

    console.log(`🚀 Found user: ${user.name} (@${user.username}) - ${user.email}`);
    console.log('📦 Cleaning up related records...');

    const userId = user.id;

    // We must delete in order because there are no CASCADE rules in schema.prisma currently
    try {
        // 1. Delete Social interactions
        await prisma.notification.deleteMany({ where: { OR: [{ userId }, { fromId: userId }] } });
        await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
        await prisma.friendRequest.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
        await prisma.friendship.deleteMany({ where: { OR: [{ userId }, { friendId: userId }] } });

        // 2. Delete Story interactions
        await prisma.storyComment.deleteMany({ where: { userId } });
        await prisma.storyLike.deleteMany({ where: { userId } });
        await prisma.storyView.deleteMany({ where: { userId } });

        // 3. Delete Stories (and their dependencies)
        const stories = await prisma.story.findMany({ where: { authorId: userId }, select: { id: true } });
        const storyIds = stories.map(s => s.id);
        await prisma.storyComment.deleteMany({ where: { storyId: { in: storyIds } } });
        await prisma.storyLike.deleteMany({ where: { storyId: { in: storyIds } } });
        await prisma.storyView.deleteMany({ where: { storyId: { in: storyIds } } });
        await prisma.story.deleteMany({ where: { authorId: userId } });

        // 4. Delete Post interactions
        await prisma.comment.deleteMany({ where: { userId } });
        await prisma.like.deleteMany({ where: { userId } });

        // 5. Delete Posts (and their dependencies)
        const posts = await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } });
        const postIds = posts.map(p => p.id);
        await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.like.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.post.deleteMany({ where: { authorId: userId } });

        // 6. Delete Authentication tokens
        await prisma.passwordResetToken.deleteMany({ where: { userId } });

        // 7. Finally, delete the User
        await prisma.user.delete({ where: { id: userId } });

        console.log(`✅ Successfully deleted user ${user.username} and all their associated data.`);
    } catch (error) {
        console.error('❌ Error during deletion:', error);
    }
}

deleteUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
