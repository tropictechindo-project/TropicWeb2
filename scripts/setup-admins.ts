import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const ADMIN_EMAILS = [
    'admin@tropictech.com',
    'tropictechbali@gmail.com',
    'damnbayu@gmail.com'
]
const DEFAULT_PASSWORD = 'Car4sale123!'

async function setupAdmins() {
    console.log('🚀 Setting up default admin accounts via Database bypass...')
    const hashedPassword = await hash(DEFAULT_PASSWORD, 10)

    for (const email of ADMIN_EMAILS) {
        console.log(`\nProcessing ${email}...`)

        try {
            // Check if they exist in auth.users
            let users: any[] = await prisma.$queryRawUnsafe(`
                SELECT id FROM auth.users WHERE email = '${email}';
            `)

            if (users.length === 0) {
                console.log(`Inserting ${email} directly into auth.users...`)
                // Generate a new UUID for the user
                const newId = crypto.randomUUID()
                await prisma.$executeRawUnsafe(`
                    INSERT INTO auth.users (
                        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
                    ) VALUES (
                        '00000000-0000-0000-0000-000000000000', '${newId}', 'authenticated', 'authenticated', '${email}',
                        crypt('${DEFAULT_PASSWORD}', gen_salt('bf')), now(),
                        now(), now(), '', '', '', ''
                    );
                 `)

                // Re-fetch to get the new ID structure
                users = await prisma.$queryRawUnsafe(`
                    SELECT id FROM auth.users WHERE email = '${email}';
                 `)
            } else {
                console.log(`Updating existing auth.users record for ${email}...`)
                await prisma.$executeRawUnsafe(`
                    UPDATE auth.users 
                    SET encrypted_password = crypt('${DEFAULT_PASSWORD}', gen_salt('bf')),
                        email_confirmed_at = COALESCE(email_confirmed_at, now()),
                        updated_at = now()
                    WHERE email = '${email}';
                `)
            }

            // Grab their uuid from the db
            // The 'users' array should now contain the user's ID, whether inserted or updated.
            if (users.length === 0) {
                console.error(`❌ Could not find ${email} in auth.users even after insert/update attempt.`)
                continue
            }

            const sbUserId = users[0].id

            // Upsert into our public.User table
            await prisma.user.upsert({
                where: { email },
                update: {
                    id: sbUserId,
                    password: hashedPassword,
                    role: 'ADMIN',
                    isVerified: true
                },
                create: {
                    id: sbUserId,
                    email,
                    username: email.split('@')[0],
                    fullName: email.split('@')[0],
                    password: hashedPassword,
                    role: 'ADMIN',
                    isVerified: true,
                    whatsapp: '+628000000000'
                }
            })
            console.log(`✅ Prisma record synced for ${email} with ADMIN role.`)

        } catch (error) {
            console.error(`❌ Error processing ${email}:`, error)
        }
    }

    console.log('\n🎉 Finished setting up admins.')
}

setupAdmins()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
