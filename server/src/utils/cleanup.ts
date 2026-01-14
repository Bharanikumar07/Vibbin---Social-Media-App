import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Auto-delete posts and stories older than 24 hours
 * Runs every hour to check for expired content
 */
export const startCleanupJobs = () => {
    // Run cleanup every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            // Delete posts older than 24 hours
            const deletedPosts = await prisma.post.deleteMany({
                where: {
                    createdAt: {
                        lt: twentyFourHoursAgo
                    }
                }
            });

            // Delete stories older than 24 hours
            const deletedStories = await prisma.story.deleteMany({
                where: {
                    createdAt: {
                        lt: twentyFourHoursAgo
                    }
                }
            });

            console.log(`🗑️  Cleanup completed at ${new Date().toISOString()}`);
            console.log(`   - Deleted ${deletedPosts.count} posts older than 24 hours`);
            console.log(`   - Deleted ${deletedStories.count} stories older than 24 hours`);
        } catch (error) {
            console.error('❌ Cleanup job failed:', error);
        }
    });

    console.log('✅ Auto-cleanup jobs started (runs every hour)');
    console.log('   - Posts older than 24 hours will be auto-deleted');
    console.log('   - Stories older than 24 hours will be auto-deleted');
};
