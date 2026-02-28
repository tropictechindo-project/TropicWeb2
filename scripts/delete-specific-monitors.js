const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("---- DELETING SPECIFIC MONITORS ----\n")

    const namesToDelete = [
        '29" UltraWide Monitor',
        '27" 4K Monitor',
        '34" UltraWide Monitor',
        '34" 4K Curved Monitor'
    ];

    const productsToDelete = await prisma.product.findMany({
        where: {
            name: { in: namesToDelete }
        },
        include: {
            variants: { include: { units: true } }
        }
    });

    console.log(`Found ${productsToDelete.length} specific monitor products to delete.`);

    for (const product of productsToDelete) {
        console.log(`Deleting [${product.id}] ${product.name}...`)
        await prisma.$transaction(async (tx) => {
            const unitsToNullify = await tx.productUnit.findMany({
                where: { variant: { productId: product.id } },
                select: { id: true }
            });

            if (unitsToNullify.length > 0) {
                const unitIds = unitsToNullify.map(u => u.id);
                await tx.rentalItem.updateMany({
                    where: { unitId: { in: unitIds } },
                    data: { unitId: null }
                });
            }

            await tx.product.delete({
                where: { id: product.id }
            });
        });
    }

    console.log(`\nSuccessfully deleted specific monitors.\n`);
}

main()
    .catch((e) => {
        console.error("FATAL SCRIPT ERROR:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
