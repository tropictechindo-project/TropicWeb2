import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { generateAssetTag } from '@/lib/inventory-utils'

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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const stock = productRaw.variants.reduce((acc, v) => acc + v.units.filter(u => u.status === 'AVAILABLE').length, 0)
    const mappedVariants = productRaw.variants.map(v => ({
      id: v.id,
      color: v.color,
      sku: v.sku,
      monthlyPrice: Number(v.monthlyPrice) || Number(productRaw.monthlyPrice),
      stock: v.units.filter(u => u.status === 'AVAILABLE').length,
      units: v.units
    }))

    return NextResponse.json({ product: { ...productRaw, stock, variants: mappedVariants } })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      // 1. Get existing variants and units
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        include: { units: { orderBy: { createdAt: 'asc' } } }
      })

      // 2. Update Product Root
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          monthlyPrice: data.monthlyPrice,
          imageUrl: data.imageUrl,
          images: data.images || [],
          discountPercentage: data.discountPercentage,
          specs: data.specs || {},
        }
      })

      // 3. Reconcile Variants
      for (const v of data.variants) {
        let variantId: string
        const existing = existingVariants.find(ev => ev.color === v.color)

        if (existing) {
          variantId = existing.id
          await tx.productVariant.update({
            where: { id: variantId },
            data: {
              sku: v.sku || existing.sku,
              monthlyPrice: v.monthlyPrice || data.monthlyPrice
            }
          })
        } else {
          const newV = await tx.productVariant.create({
            data: {
              productId: id,
              color: v.color,
              sku: v.sku || `${data.name.substring(0,3).toUpperCase()}-${v.color.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
              monthlyPrice: v.monthlyPrice || data.monthlyPrice
            }
          })
          variantId = newV.id
        }

        // 4. Reconcile Units for this Variant
        const currentUnits = existing?.units || []
        const targetStock = parseInt(v.stockQuantity) || 0
        const currentStock = currentUnits.filter(u => u.status === 'AVAILABLE').length

        if (targetStock > currentStock) {
          // Add Units
          const toAdd = targetStock - currentStock
          const startSeq = currentUnits.length + 1
          for (let i = 0; i < toAdd; i++) {
            const sequence = startSeq + i
            const assetTag = generateAssetTag({
              category: data.category,
              modelName: data.name,
              sequence,
              purchaseDate: new Date()
            })
            const serialNumber = `SN-${v.color.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}-${sequence.toString().padStart(3, '0')}`

            await tx.productUnit.create({
              data: {
                variantId,
                serialNumber,
                assetTag,
                status: 'AVAILABLE',
                condition: 'GOOD',
                purchasePrice: v.purchasePrice || 0,
                installmentDuration: v.installmentMonths || 0,
                installmentMonthly: v.installmentMonths > 0 ? (v.purchasePrice / v.installmentMonths) : 0,
                installmentRemaining: v.purchasePrice || 0,
                purchaseDate: new Date()
              }
            })
          }
        } else if (targetStock < currentStock) {
          // Remove extra AVAILABLE units if needed (optional, safer to keep but user wants sync)
          const toRemove = currentStock - targetStock
          const availableUnits = currentUnits.filter(u => u.status === 'AVAILABLE')
          const unitsToDelete = availableUnits.slice(-toRemove)
          
          if (unitsToDelete.length > 0) {
            await tx.productUnit.deleteMany({
              where: { id: { in: unitsToDelete.map(u => u.id) } }
            })
          }
        }
      }

      return updatedProduct
    })

    await logActivity({
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      details: `Updated product ${product.name} (ID: ${id}) and reconciled units.`
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.$transaction(async (tx) => {
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

      await tx.product.delete({ where: { id } })
    })

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
