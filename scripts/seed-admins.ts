const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const admins = [
    { email: 'damnbayu@gmail.com', fullName: 'Bayu Damn', username: 'bayudamn483' },
    { email: 'tropictechindo@gmail.com', fullName: 'Jasper P Parson', username: 'jasperadmin' },
    { email: 'ceo@tropictech.online', fullName: 'Administrator', username: 'admin' },
    { email: 'admin@tropictech.com', fullName: 'Administrator', username: 'admin_sys' }
];

const DEFAULT_PASSWORD = 'Car4sale123!';

async function seedAdmins() {
    console.log('👷 Seeding Official Admins...');

    for (const admin of admins) {
        console.log(`Processing ${admin.email}...`);

        // 1. Sync to Supabase Auth
        const { data: authUser, error: findError } = await supabase.auth.admin.listUsers();
        let existingAuth = authUser?.users.find(u => u.email === admin.email);
        let supabaseId;

        if (existingAuth) {
            console.log(`  - User exists in Supabase. Updating meta...`);
            const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existingAuth.id, {
                user_metadata: { full_name: admin.fullName, username: admin.username, role: 'ADMIN' },
                password: DEFAULT_PASSWORD
            });
            if (updateError) console.error(`  ❌ Update error: ${updateError.message}`);
            supabaseId = existingAuth.id;
        } else {
            console.log(`  - Creating in Supabase...`);
            const { data: created, error: createError } = await supabase.auth.admin.createUser({
                email: admin.email,
                password: DEFAULT_PASSWORD,
                user_metadata: { full_name: admin.fullName, username: admin.username, role: 'ADMIN' },
                email_confirm: true
            });
            if (createError) {
                console.error(`  ❌ Creation error: ${createError.message}`);
                continue;
            }
            supabaseId = created.user.id;
        }

        // 2. Save to Prisma
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const user = await prisma.user.upsert({
            where: { email: admin.email },
            update: {
                id: supabaseId,
                username: admin.username,
                password: hashedPassword,
                fullName: admin.fullName,
                role: 'ADMIN',
                isVerified: true
            },
            create: {
                id: supabaseId,
                email: admin.email,
                username: admin.username,
                password: hashedPassword,
                fullName: admin.fullName,
                whatsapp: '+628000000000',
                role: 'ADMIN',
                isVerified: true
            }
        });

        console.log(`  ✅ Admin synced: ${user.fullName} (${user.email})`);
    }

    console.log('🏁 Admin Seeding Complete!');
}

seedAdmins()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
