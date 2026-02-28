import { db } from './src/lib/db';
async function test() {
  try {
    const unitCount = await db.productUnit.count();
    console.log('✅ ProductUnit model is accessible. Count:', unitCount);
    const order = await db.order.findFirst({
      include: { user: true, rentalItems: { include: { unit: true } } }
    });
    console.log('✅ Order relations (user, unit) are accessible.');
  } catch (e: any) {
    console.error('❌ Prisma Runtime Error:', e.message);
  }
}
test();
