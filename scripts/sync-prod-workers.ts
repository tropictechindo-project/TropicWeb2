const { PrismaClient } = require('../src/generated/client');
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const workers = [
    {
        email: 'worker1@tropictech.online',
        fullName: 'Worker One',
        whatsapp: '+6281234567891',
        password: 'WorkerAdmin2026!'
    },
    {
        email: 'worker2@tropictech.online',
        fullName: 'Worker Two',
        whatsapp: '+6281234567892',
        password: 'WorkerAdmin2026!'
    }
];

async function syncWorkers() {
    console.log('🚀 Syncing production workers...');

    for (const data of workers) {
        try {
            // 1. Check/Create in Supabase
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: data.email,
                password: data.password,
                email_confirm: true,
                user_metadata: { full_name: data.fullName }
            });

            let userId = '';
            if (authError) {
                if (authError.message.includes('already registered')) {
                    const { data: existing } = await supabase.auth.admin.listUsers();
                    const user = existing.users.find(u => u.email === data.email);
                    userId = user?.id || '';
                    console.log(`ℹ️ ${data.email} already in Supabase.`);
                } else {
                    console.error(`❌ Supabase error for ${data.email}:`, authError.message);
                    continue;
                }
            } else {
                userId = authUser.user.id;
                console.log(`✅ ${data.email} created in Supabase.`);
            }

            // 2. Check/Create in Prisma
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const username = data.email.split('@')[0];

            await prisma.user.upsert({
                where: { email: data.email },
                update: {
                    id: userId,
                    role: 'WORKER',
                    fullName: data.fullName,
                    isActive: true,
                    isVerified: true
                },
                create: {
                    id: userId,
                    email: data.email,
                    username,
                    password: hashedPassword,
                    fullName: data.fullName,
                    whatsapp: data.whatsapp,
                    role: 'WORKER',
                    isActive: true,
                    isVerified: true
                }
            });
            console.log(`✅ ${data.email} synced to Prisma.`);
        } catch (err) {
            console.error(`❌ Error syncing ${data.email}:`, err);
        }
    }

    await prisma.$disconnect();
    console.log('🏁 Workers sync complete.');
}

syncWorkers();
