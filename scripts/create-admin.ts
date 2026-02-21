import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'tropictechindo@gmail.com'
    const password = 'JasAdmin2026'
    const fullName = 'Jasper P Parson'
    const whatsapp = '+61 427571742'
    const baliAddress = 'Canggu, Bali'
    const mapsAddressLink = ''

    console.log('Creating admin user...')

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                fullName,
                whatsapp,
                baliAddress,
                mapsAddressLink,
                password: hashedPassword,
                role: 'ADMIN',
                isVerified: true,
            },
            create: {
                username: 'jasperadmin',
                email,
                password: hashedPassword,
                fullName,
                whatsapp,
                baliAddress,
                mapsAddressLink,
                role: 'ADMIN',
                isVerified: true,
            },
        })

        console.log('Admin user created/updated successfully:', user.email)
    } catch (error) {
        console.error('Error creating admin user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
