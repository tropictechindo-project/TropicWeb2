const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('👷 Restoring Admin User from backup...');

    // Data from custom_dump.sql
    const adminData = {
        id: 'cmjrzt0wh0000rpei6oiwca1h',
        username: 'admin',
        password: '$2b$10$CXjzrIOgs5iCgThz7tdsQ.S/VTO.16Eb9p27EmyzZwwQmYjP2OrAm',
        email: 'tropictechindo@gmail.com',
        fullName: 'Tropic Tech Admin',
        whatsapp: '+6282266574860',
        role: 'ADMIN',
        isVerified: true
    };

    try {
        const user = await prisma.user.upsert({
            where: { email: adminData.email },
            update: adminData,
            create: adminData
        });
        console.log(`✅ Admin restored: ${user.fullName} (${user.email})`);

        // Also restore the other admin from seed_users.ts if we can find a hash or just use a placeholder
        const bayuEmail = 'damnbayu@gmail.com';
        const bayu = await prisma.user.upsert({
            where: { email: bayuEmail },
            update: {
                fullName: 'Bayu Damn',
                username: 'bayudamn483',
                role: 'ADMIN',
                isVerified: true
            },
            create: {
                id: 'cmjrzt0wj0000rpeibayu483', // Placeholder ID
                email: bayuEmail,
                fullName: 'Bayu Damn',
                username: 'bayudamn483',
                role: 'ADMIN',
                isVerified: true,
                password: '$2b$10$CXjzrIOgs5iCgThz7tdsQ.S/VTO.16Eb9p27EmyzZwwQmYjP2OrAm', // Use same temporary hash as admin
                whatsapp: '+628000000000'
            }
        });
        console.log(`✅ Admin (Bayu) restored: ${bayu.fullName}. Note: Temporary password hash set.`);

    } catch (error) {
        console.error('Error restoring admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
