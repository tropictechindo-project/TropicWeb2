import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.findFirst({
    where: { rentalPackageItems: { some: {} } }
  })
  if (!product) {
    console.log('No product to delete for test')
    return
  }
  console.log('Trying to delete product:', product.id)
  try {
    // Run inside a failed transaction so it never actually deletes anything in production
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
