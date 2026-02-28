const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({ select: { id: true, name: true, category: true } });
    const categories = {};
    for (const p of products) {
        if (!categories[p.category]) categories[p.category] = [];
        categories[p.category].push(p);
    }

    console.log("Unique Categories in DB right now:");
    for (const [cat, list] of Object.entries(categories)) {
        console.log(`- "${cat}" (${list.length} products)`);
        if (cat.toLowerCase().includes('chair') || cat.toLowerCase().includes('desk') || cat.toLowerCase().includes('monitor')) {
            list.forEach(p => console.log(`   -> [${p.id}] ${p.name}`));
        }
    }
}
main().finally(() => prisma.$disconnect());
