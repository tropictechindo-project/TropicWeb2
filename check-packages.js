const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.rentalPackage.findMany({
    select: { id: true, name: true, imageUrl: true }
  });
  console.log('--- Rental Packages ---');
  console.log(JSON.stringify(packages, null, 2));
  console.log('-----------------------');
}

main()
  .catch((e) => console.error('❌ Error:', e.message))
  .finally(async () => {
    await prisma.$disconnect();
  });
