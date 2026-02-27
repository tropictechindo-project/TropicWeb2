const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("---- STARTING PLURAL CATEGORY DUPLICATE CLEANUP ----\n")

    const targetCategories = ['Chairs', 'Monitors', 'Desks'];

    const productsToDelete = await prisma.product.findMany({
        where: {
            category: { in: targetCategories }
        },
        include: {
            variants: {
                include: { units: true }
            }
        }
    });

    console.log(`Found ${productsToDelete.length} products to delete in categories: ${targetCategories.join(', ')}.`);

    let deletedCount = 0;

    for (const product of productsToDelete) {
        console.log(`Deleting [${product.id}] ${product.name} (Category: ${product.category})...`)

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

        deletedCount++;
    }

    console.log(`\nSuccessfully deleted ${deletedCount} duplicate products.\n`);
    console.log("------------------------------------------------------------------");
}

main()
    .catch((e) => {
        console.error("FATAL SCRIPT ERROR:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
