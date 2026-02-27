const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log("---- STARTING DB CLEANUP ----\n")

    // 1. Find all products without an image
    // Sometimes it's null, sometimes it's an empty string. Let's find both.
    const productsToDelete = await prisma.product.findMany({
        where: {
            OR: [
                { imageUrl: null },
                { imageUrl: '' },
                { imageUrl: { equals: '[]' } } // some array string representations
            ]
        },
        include: {
            variants: {
                include: { units: true }
            }
        }
    });

    console.log(`Found ${productsToDelete.length} products without an image.`);

    let deletedCount = 0;

    for (const product of productsToDelete) {
        console.log(`Deleting [${product.id}] ${product.name}...`)

        // Use a transaction just like we did in the API route to avoid Foreign Key errors
        await prisma.$transaction(async (tx) => {
            // Nullify unitIds from RentalItems
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

            // Safely delete the product
            await tx.product.delete({
                where: { id: product.id }
            });
        });

        deletedCount++;
    }

    console.log(`\nSuccessfully deleted ${deletedCount} products without photos.\n`);
    console.log("------------------------------------------------------------------");

    // 2. Identify potential duplicates among the REMAINING products
    console.log("\n---- SCANNING FOR DUPLICATES ----\n")

    const remainingProducts = await prisma.product.findMany({
        select: { id: true, name: true }
    });

    const groups = {};

    // Group by exact lowercase name to find direct duplicates easily
    for (const p of remainingProducts) {
        // Strip out common noise words for a better match if needed, but for now exact lowercase is good
        const key = p.name.trim().toLowerCase();

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(p);
    }

    const outputRows = [];

    // Also do a simple fuzzy match (e.g. "iPhone 13", "iphone 13 pro" etc) using a primitive subset check
    for (const [name, list] of Object.entries(groups)) {
        if (list.length > 1) {
            outputRows.push(`\nExact Duplicate Name: "${name}" (${list.length} instances)`);
            list.forEach(item => {
                outputRows.push(`  - ID: ${item.id} | Name: ${item.name}`);
            });
        }
    }

    // Rough fuzzy grouping
    const fuzzyGroups = [];
    const usedIds = new Set();

    for (let i = 0; i < remainingProducts.length; i++) {
        if (usedIds.has(remainingProducts[i].id)) continue;

        const currentName = remainingProducts[i].name.toLowerCase();
        // Skip very short names to avoid mass false positives
        if (currentName.length < 4) continue;

        const simGroup = [remainingProducts[i]];
        usedIds.add(remainingProducts[i].id);

        for (let j = i + 1; j < remainingProducts.length; j++) {
            if (usedIds.has(remainingProducts[j].id)) continue;

            const compareName = remainingProducts[j].name.toLowerCase();

            // Very basic subset check for similarity
            // If one string contains the other, and the length difference isn't massive
            if ((currentName.includes(compareName) || compareName.includes(currentName)) && currentName !== compareName) {
                simGroup.push(remainingProducts[j]);
                usedIds.add(remainingProducts[j].id);
            }
        }

        if (simGroup.length > 1) {
            fuzzyGroups.push(simGroup);
        }
    }

    if (fuzzyGroups.length > 0) {
        outputRows.push(`\n-- Potential Similar/Fuzzy Duplicates --`);
        fuzzyGroups.forEach(group => {
            outputRows.push(``);
            group.forEach(item => {
                outputRows.push(`  - ID: ${item.id} | Name: ${item.name}`);
            });
        });
    }

    if (outputRows.length === 0) {
        console.log("No exact or potentially similar duplicates found!");
    } else {
        console.log(outputRows.join('\n'));
    }

}

main()
    .catch((e) => {
        console.error("FATAL SCRIPT ERROR:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
