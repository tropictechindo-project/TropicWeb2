import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  try {
    const products = await db.product.findMany({
      where: category ? { category } : undefined,
      include: {
        variants: {
          include: { units: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedProducts = products.map(p => {
      const stock = p.variants.reduce((total, v) => total + v.units.filter(u => u.status === 'AVAILABLE').length, 0)

      const mappedVariants = p.variants.map(v => ({
        id: v.id,
        color: v.color,
        sku: v.sku,
        monthlyPrice: Number(v.monthlyPrice) || Number(p.monthlyPrice),
        stock: v.units.filter(u => u.status === 'AVAILABLE').length
      }))

      return {
        ...p,
        stock,
        variants: mappedVariants
      }
    })

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const product = await db.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: json.name,
          description: json.description,
          category: json.category,
          monthlyPrice: json.monthlyPrice,
          imageUrl: json.imageUrl,
          images: json.images || [],
          discountPercentage: json.discountPercentage || 0,
        }
      })

      const categoryCode = (json.category || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
      const yearSuffix = new Date().getFullYear().toString().slice(-2)

      if (json.variants && Array.isArray(json.variants)) {
        for (const v of json.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku: v.sku,
              color: v.color,
              monthlyPrice: v.monthlyPrice || json.monthlyPrice
            }
          })

          // Create Units if stockQuantity is provided
          const stockQty = parseInt(v.stockQuantity) || 0
          if (stockQty > 0) {
            for (let i = 0; i < stockQty; i++) {
              const sequence = (i + 1).toString().padStart(3, '0')
              const assetTag = `TT-${categoryCode}-${yearSuffix}-${Date.now().toString().slice(-4)}-${sequence}`
              const serialNumber = `SN-${v.sku}-${Date.now().toString().slice(-4)}-${sequence}`

              await tx.productUnit.create({
                data: {
                  variantId: variant.id,
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
          }
        }
      }

      return newProduct
    })

    await logActivity({
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      details: `Created product ${product.name} (ID: ${product.id})`
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
