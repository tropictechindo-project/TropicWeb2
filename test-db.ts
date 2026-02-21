
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking keys on prisma instance:')
    console.log(Object.keys(prisma))

    // Check if rentalPackage exists
    // @ts-ignore
    if (prisma.rentalPackage) {
        console.log('prisma.rentalPackage exists!')
        // @ts-ignore
        const count = await prisma.rentalPackage.count()
        console.log('Count:', count)
    } else {
        console.log('prisma.rentalPackage is UNDEFINED')
        console.log('Does prisma.package exist?', 'package' in prisma)
        console.log('Does prisma.packages exist?', 'packages' in prisma)
    }
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
