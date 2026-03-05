import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        select: { category: true }
    })
    const uniqueCats = new Set(products.map(p => p.category))
    console.log(Array.from(uniqueCats))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
