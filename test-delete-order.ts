import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.findFirst({
    where: { variants: { some: { units: { some: { rentalItems: { some: {} } } } } } }
  })
  if (!product) {
    console.log('No rented product to delete for test')
    return
  }
  console.log('Trying to delete product with active order:', product.id)
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: product.id } })
      throw new Error("ROLLBACK")
    })
  } catch (err: any) {
    if (err.message === "ROLLBACK") {
      console.log("SUCCESS")
    } else {
      console.error("ERROR:", err.message)
    }
  }
}
main().finally(() => prisma.$disconnect())
