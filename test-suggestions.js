const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.findFirst();
    if (!product) { console.log('No products found'); return; }
    console.log('Testing with productId:', product.id);
    const productIds = [product.id];
    
    console.log('1. Querying relations...');
    const relations = await prisma.productRelation.findMany({
        where: { productId: { in: productIds } },
        include: { relatedProduct: true },
        orderBy: [ { relationType: 'asc' }, { priority: 'desc' } ]
    });
    console.log('Found relations:', relations.length);

    console.log('2. Querying categories...');
    const cartProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { category: true }
    });
    console.log('Cart categories:', cartProducts);
    
    console.log('3. Fallback relations...');
    const fallbackRelations = await prisma.productRelation.findMany({
        include: { relatedProduct: true },
        orderBy: { priority: 'desc' },
        take: 4
    });
    console.log('Fallback relations:', fallbackRelations.length);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
