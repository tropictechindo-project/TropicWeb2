import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const keyboardRes = await prisma.product.updateMany({
        where: { category: 'Mouse And Keyboard' },
        data: { category: 'Mouse and Keyboard' }
    })

    const othersRes = await prisma.product.updateMany({
        where: { category: 'Others' },
        data: { category: 'Other' }
    })

    console.log('Categories Updated:', {
        mouseAndKeyboard: keyboardRes.count,
        others: othersRes.count
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
