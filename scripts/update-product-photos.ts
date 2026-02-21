import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Updating product photos from explicit list...')

    const updates = [
        { name: 'Workstation Solo', image: '/products/Workstation Solo.webp' },
        { name: 'Workstation Core', image: '/products/Workstation Core.webp' },
        { name: 'Workstation Plus', image: '/products/Workstation Plus.webp' },
        { name: 'Workstation Pro', image: '/products/Workstation Pro.webp' },
        { name: '27" HD Monitor', image: '/products/27" HD Monitor.webp' },
        { name: '29" UltraWide Monitor', image: '/products/29" UltraWide Monitor.webp' },
        { name: '34" UltraWide Monitor', image: '/products/34" UltraWide Monitor.webp' },
        { name: '27" 4K Monitor', image: '/products/27" 4K Monitor.webp' },
        { name: '34" 4K Curved Monitor', image: '/products/34" 4K Curved Monitor.webp' },
        { name: 'Ergonomic Chair Basic', image: '/products/Ergonomic Chair Basic.webp' },
        { name: 'Ergonomic Chair Lite', image: '/products/Ergonomic Chair Lite.webp' },
        { name: 'Ergonomic Chair Plus', image: '/products/Ergonomic Chair Plus.webp' },
        { name: 'Ergonomic Chair Pro', image: '/products/Ergonomic Chair Pro.webp' },
        { name: 'Logitech Combo', image: '/products/Logitech Combo.webp' },
        { name: 'Magic Combo', image: '/products/Magic Combo.webp' },
        { name: 'MX Master Combo', image: '/products/MX Master Combo.webp' },
        { name: 'Smart Power Board (Worldwide Support)', image: '/products/Smart Power Board (Worldwide Support).webp' },
        { name: '8K USB HUB', image: '/products/8K USB HUB.webp' },
        { name: '360 Laptop Stand', image: '/products/360 Laptop Stand.webp' },
        { name: 'Monitor Bracket', image: '/products/Monitor Bracket.webp' },
        { name: 'Attachable Desk Lamp', image: '/products/Attachable Desk Lamp.webp' },
        { name: 'Mouse Pad', image: '/products/Mouse Pad.webp' },
        { name: 'Test Desk', image: '/products/java.webp' },
        { name: 'Test Products', image: '/products/java.webp' },
    ]

    for (const update of updates) {
        const result = await prisma.product.updateMany({
            where: { name: update.name },
            data: {
                imageUrl: update.image,
                images: [update.image]
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
