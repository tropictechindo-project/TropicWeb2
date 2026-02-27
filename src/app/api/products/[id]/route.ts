import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productRaw = await db.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: { units: true }
        }
      }
    })

    if (!productRaw) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const stock = productRaw.variants.reduce((acc, v) => acc + v.units.filter(u => u.status === 'AVAILABLE').length, 0)
    const product = { ...productRaw, stock }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const product = await db.$transaction(async (tx) => {
      // 1. Get existing variants to preserve their units
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        include: { units: true }
      })

      // 2. Update product
      return await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          monthlyPrice: data.monthlyPrice,
          imageUrl: data.imageUrl,
          discountPercentage: data.discountPercentage,
          variants: {
            deleteMany: {}, // Delete all and recreate based on data
            create: data.variants.map((v: any) => ({
              sku: v.sku,
              color: v.color,
              // monthlyPrice can be specific to variant
              monthlyPrice: v.monthlyPrice || data.monthlyPrice
            }))
          }
        },
        include: { variants: true }
      })
    })

    await logActivity({
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      details: `Updated product ${product.name} (ID: ${id}) with ${product.variants.length} color variants`
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$transaction(async (tx) => {
      // 1. Manually nullify unitId on any RentalItems associated with this product's units
      // to avoid Postgres Foreign Key violation when deleting the product cascade down to units
      const unitsToNullify = await tx.productUnit.findMany({
        where: { variant: { productId: id } },
        select: { id: true }
      })

      if (unitsToNullify.length > 0) {
        const unitIds = unitsToNullify.map(u => u.id)
        await tx.rentalItem.updateMany({
          where: { unitId: { in: unitIds } },
          data: { unitId: null }
        })
      }

      // 2. Safely delete the product (Prisma Cascades the rest like variants and units)
      await tx.product.delete({
        where: { id },
      })
    })

    await logActivity({
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      details: `Deleted product ID: ${id}`
    })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
