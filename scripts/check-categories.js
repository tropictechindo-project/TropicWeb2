const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("--- Categories ---");
    const categories = await prisma.category.findMany({
        include: {
            _count: { select: { products: true } }
        },
        orderBy: { name: 'asc' }
    });

    categories.forEach(c => console.log(`[${c.id}] ${c.name} (${c._count.products} products)`));
}

main().finally(() => prisma.$disconnect());
