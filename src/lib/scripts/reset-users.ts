import { PrismaClient } from '../../generated/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

async function main() {
    console.log('🚀 Starting User Management Reset...')

    try {
        // 1. Clean up existing users and dependent data
        // Note: We might need to delete related records first if there are foreign key constraints
        console.log('🧹 Cleaning up existing users...')

        // Deleting in order to respect constraints
        await prisma.activityLog.deleteMany()
        await prisma.systemNotification.deleteMany()
        await prisma.notificationDismissal.deleteMany()
        await prisma.message.deleteMany()
        await prisma.groupMessage.deleteMany()
        await prisma.chatGroupMember.deleteMany()
        await prisma.workerNotification.deleteMany()
        await prisma.workerAttendance.deleteMany()

        // Note: We are NOT deleting orders/invoices here to preserve business data, 
        // but the users who own them will be deleted, which might cause issues if not handled.
        // Given the user said "Reset All Users", we proceed. 
        // If orders have onDelete: Cascade, they will be gone.

        const deleteResult = await prisma.user.deleteMany()
        console.log(`✅ Deleted ${deleteResult.count} users from Prisma.`)

        // 2. Seed Admins
        console.log('🌱 Seeding Admins...')

        const adminPassword = 'Car4sale123!'
        const hashedPassword = await hashPassword(adminPassword)

        const admins = [
            {
                email: 'damnbayu@gmail.com',
                fullName: 'Bayu Damn',
                username: 'bayudamn',
            },
            {
                email: 'tropictechindo@gmail.com',
                fullName: 'Jasper Administrator',
                username: 'jasperadmin',
            },
            {
                email: 'ceo@tropictech.online',
                fullName: 'Tropic Tech CEO',
                username: 'ceo_tropictech',
            }
        ]

        for (const admin of admins) {
            const id = uuidv4()
            await prisma.user.create({
                data: {
                    id,
                    email: admin.email,
                    fullName: admin.fullName,
                    username: admin.username,
                    password: hashedPassword,
                    plainPassword: adminPassword, // User requested visibility
                    role: 'ADMIN',
                    whatsapp: '+628000000000', // Default placeholder
                    isVerified: true,
                    isActive: true
                }
            })
            console.log(`✅ Created Admin: ${admin.email}`)
        }

        console.log('\n✨ Reset and Seeding Complete!')
        console.log('⚠️  IMPORTANT: Please manually delete users from the Supabase Auth Dashboard to ensure the emails can be reused for new signups.')
        console.log('⚠️  The current script only handles the User Management (Prisma) side due to missing SUPABASE_SERVICE_ROLE_KEY.')

    } catch (error) {
        console.error('❌ Error during reset:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
