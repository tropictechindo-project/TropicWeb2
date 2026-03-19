const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SYSTEM AUDIT ===');

  try {
    // 1. Audit Products
    const products = await prisma.product.findMany({
      select: { id: true, name: true, category: true, description: true, specs: true }
    });
    console.log('\n--- 📦 Products ---');
    console.log(JSON.stringify(products, null, 2));

    // 2. Audit Packages
    const packages = await prisma.rentalPackage.findMany({
      select: { id: true, name: true, description: true, specs: true }
    });
    console.log('\n--- 🎁 Packages ---');
    console.log(JSON.stringify(packages, null, 2));

    // 3. Audit Site Settings (for locations/promotions)
    const settings = await prisma.siteSetting.findMany();
    console.log('\n--- ⚙️ Site Settings ---');
    console.log(JSON.stringify(settings, null, 2));

  } catch (e) {
    console.error('❌ Error during audit:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
