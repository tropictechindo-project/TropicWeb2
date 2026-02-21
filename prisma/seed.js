
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // Create Admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@tropictech.com',
            password: hashedPassword,
            fullName: 'Administrator',
            role: 'ADMIN',
            whatsapp: '+628000000000',
        },
    })
    console.log('Admin created:', admin.username)

    // Create Sample Products
    const products = [
        {
            name: 'Ergonomic Standing Desk',
            description: 'Electric adjustable height standing desk, bamboo top.',
            category: 'Desks',
            monthlyPrice: 1500000,
            stock: 10,
            imageUrl: '/images/products/standing-desk.jpg',
        },
        {
            name: 'Herman Miller Aeron',
            description: 'The ultimate ergonomic office chair.',
            category: 'Chairs',
            monthlyPrice: 2000000,
            stock: 5,
            imageUrl: '/images/products/aeron.jpg',
        },
        {
            name: '4K Monitor 27"',
            description: 'Ultra HD 4K Monitor, perfect for designers.',
            category: 'Monitors',
            monthlyPrice: 800000,
            stock: 15,
            imageUrl: '/images/products/monitor-4k.jpg',
        },
    ]

    for (const p of products) {
        await prisma.product.create({ data: p })
    }
    console.log('Sample products created')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
