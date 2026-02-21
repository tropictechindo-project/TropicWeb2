const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('🔍 Checking Database Content...');

    const productCount = await prisma.product.count();
    const packageCount = await prisma.rentalPackage.count();
    const userCount = await prisma.user.count();
    const settingsCount = await prisma.siteSetting.count();

    console.log(`📊 Products: ${productCount}`);
    console.log(`📊 Packages: ${packageCount}`);
    console.log(`📊 Users: ${userCount}`);
    console.log(`📊 Site Settings: ${settingsCount}`);

    if (productCount > 0) {
        const sample = await prisma.product.findFirst();
        console.log('📝 Sample Product:', sample.name);
    }

    await prisma.$disconnect();
}

check();
