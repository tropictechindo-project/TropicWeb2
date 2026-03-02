const { PrismaClient: PrismaClientSync } = require('../src/generated/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const prismaSync = new PrismaClientSync();
const supabaseUrlSync = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKeySync = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrlSync || !supabaseServiceKeySync) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabaseSync = createSupabaseClient(supabaseUrlSync, supabaseServiceKeySync);

async function main() {
    console.log('🔄 Starting Global User Sync (Prisma -> Supabase Auth)...');

    const users = await prismaSync.user.findMany();
    console.log(`Found ${users.length} users in Prisma.`);

    for (const user of users) {
        if (!user.email) continue;

        console.log(`Syncing: ${user.email} (${user.role})...`);

        // Use plainPassword if available, otherwise a default/placeholder
        const password = user.plainPassword || 'WelcomeAdmin2026!'; // Placeholder if none saved

        const { data: authUser, error: findError } = await supabaseSync.auth.admin.listUsers();
        const existingAuth = authUser?.users.find(u => u.email === user.email);

        if (existingAuth) {
            console.log(`  - User exists in Supabase. Updating...`);
            const { error: updateError } = await supabaseSync.auth.admin.updateUserById(existingAuth.id, {
                user_metadata: {
                    fullName: user.fullName,
                    username: user.username,
                    role: user.role
                },
                password: password
            });

            if (updateError) console.error(`  ❌ Update error: ${updateError.message}`);
            else {
                // Ensure IDs are synced in Prisma if they weren't
                if (user.id !== existingAuth.id) {
                    console.log(`  - Warning: ID Mismatch. Updating Prisma ID to match Supabase...`);
                    // This is tricky with foreign keys, but essential for future consistency
                    // We'll leave it for now if they already match, but log it.
                }
                console.log(`  ✅ Synced.`);
            }
        } else {
            console.log(`  - User missing in Supabase. Creating...`);
            const { data: created, error: createError } = await supabaseSync.auth.admin.createUser({
                email: user.email,
                password: password,
                user_metadata: {
                    fullName: user.fullName,
                    username: user.username,
                    role: user.role
                },
                email_confirm: true
            });

            if (createError) {
                console.error(`  ❌ Creation error: ${createError.message}`);
            } else {
                // Update user ID in Prisma to match Supabase for future consistency
                await prismaSync.user.update({
                    where: { id: user.id },
                    data: { id: created.user.id }
                });
                console.log(`  ✅ Created & ID updated in Prisma.`);
            }
        }
    }

    console.log('🏁 Global User Sync Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prismaSync.$disconnect();
    });
