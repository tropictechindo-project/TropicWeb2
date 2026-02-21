import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Updating package photos...')

    const updates = [
        { name: 'The Start-Up', image: '/packages/Rental Bali1.webp' },
        { name: 'The Digital Nomad', image: '/packages/Rental Bali2.webp' },
        { name: "The Entrepreneur's Setup", image: '/packages/Rental Bali3.webp.webp' },
        { name: 'The Pro Workspace', image: '/packages/Rental Bali4.webp' },
    ]

    for (const update of updates) {
        const result = await prisma.rentalPackage.updateMany({
            where: { name: update.name },
            data: {
                imageUrl: update.image,
                images: [update.image, update.image, update.image] // Also update slider images if any
            }
        })
        console.log(`Updated ${result.count} record(s) for: ${update.name}`)
    }

    console.log('Update finished.')
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
