import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            _count: {
                select: {
                    posts: true,
                    stories: true,
                }
            }
        }
    });

    console.log('--- Current Users in Database ---');
    users.forEach(u => {
        console.log(`ID: ${u.id} | Name: ${u.name} | Username: ${u.username} | Email: ${u.email} | Posts: ${u._count.posts} | Stories: ${u._count.stories}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
