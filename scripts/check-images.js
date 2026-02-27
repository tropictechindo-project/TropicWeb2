const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const allProducts = await prisma.product.findMany({ select: { id: true, name: true, imageUrl: true } });
    console.log("Total products:", allProducts.length);
    console.log("Image URL samples:");
    allProducts.slice(0, 5).forEach(p => console.log(p.name, "=>", p.imageUrl));
    
    const weirdUrls = allProducts.filter(p => !p.imageUrl || typeof p.imageUrl !== 'string' || p.imageUrl.length < 10 || p.imageUrl === '[]' || p.imageUrl === 'null');
    console.log("\nProducts with weird/empty image URLs:", weirdUrls.length);
    weirdUrls.forEach(p => console.log(p.id, p.name, "=>", p.imageUrl));
}

main().finally(() => prisma.$disconnect());
