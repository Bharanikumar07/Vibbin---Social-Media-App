/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');
    const password = await bcrypt.hash('password123', 10);

    const users = [
        {
            name: 'Bharani',
            username: 'bharan.k',
            email: 'bharani@example.com',
            bio: 'Building the future of social connection, one vibe at a time. 🚀',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80',
            theme: 'dark',
            notificationSound: true
        },
        {
            name: 'Sarah Wilson',
            username: 'sarahw',
            email: 'sarah@example.com',
            bio: 'Travel enthusiast 🌍 | Photographer 📸',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
            theme: 'light',
            notificationSound: true
        },
        {
            name: 'James Chen',
            username: 'jamesc',
            email: 'james@example.com',
            bio: 'Tech geek 💻 | Coffee lover ☕',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
            theme: 'dark',
            notificationSound: true
        },
        {
            name: 'Emma Davis',
            username: 'emmad',
            email: 'emma@example.com',
            bio: 'Digital Artist 🎨 | Cat mom 🐱',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
            theme: 'light',
            notificationSound: true
        },
        {
            name: 'Michael Brown',
            username: 'mikeb',
            email: 'mike@example.com',
            bio: 'Fitness junkie 💪 | Foodie 🍔',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
            theme: 'dark',
            notificationSound: true
        },
        {
            name: 'Lisa Wang',
            username: 'lisaw',
            email: 'lisa@example.com',
            bio: 'Music producer 🎵 | Night owl 🦉',
            password,
            profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
            theme: 'light',
            notificationSound: true
        }
    ];

    for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
            await prisma.user.create({ data: u });
            console.log(`Created user: ${u.name}`);
        } else {
            console.log(`User already exists: ${u.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
