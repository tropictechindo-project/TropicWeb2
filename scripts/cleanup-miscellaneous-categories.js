const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("---- CLEANING UP KEYBOARDMOUSE AND RENAMING CATEGORIES ----\n")

    // 1. Delete keyboardMouse
    const productsToDelete = await prisma.product.findMany({
        where: {
            category: "keyboardMouse"
        },
        include: {
            variants: { include: { units: true } }
        }
    });

    console.log(`Found ${productsToDelete.length} products to delete in category: keyboardMouse.`);

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

    // 2. Rename categories to match desired list exactly
    console.log(`Renaming 'accessories' to 'Accessories'...`);
    await prisma.product.updateMany({
        where: { category: "accessories" },
        data: { category: "Accessories" }
    });

    console.log(`Renaming 'Others' to 'Other'...`);
    await prisma.product.updateMany({
        where: { category: "Others" },
        data: { category: "Other" }
    });

    console.log(`Renaming 'Mouse and Keyboard' to 'Mouse And Keyboard'...`);
    await prisma.product.updateMany({
        where: { category: "Mouse and Keyboard" },
        data: { category: "Mouse And Keyboard" }
    });

    console.log(`\nSuccessfully deleted duplicates and standardized category names.\n`);
}

main()
    .catch((e) => {
        console.error("FATAL SCRIPT ERROR:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
