import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Updating Smart Power Board image...')

    const name = 'Smart Power Board (Worldwide Support)'
    const image = '/products/Smart Power Board (Worldwide Support).webp'

    const result = await prisma.product.updateMany({
        where: { name: name },
        data: {
            imageUrl: image,
            images: [image]
        }
    })

    console.log(`Updated ${result.count} record(s) for: ${name}`)
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
