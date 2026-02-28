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
      return {
        ...p,
        stock
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
    const product = await db.product.create({
      data: {
        name: json.name,
        description: json.description,
        category: json.category,
        monthlyPrice: json.monthlyPrice,
        imageUrl: json.imageUrl,
        images: json.images || [],
        discountPercentage: json.discountPercentage || 0,
        variants: {
          create: json.variants?.map((v: any) => ({
            sku: v.sku,
            color: v.color,
            monthlyPrice: v.monthlyPrice || json.monthlyPrice
          })) || []
        }
      },
      include: { variants: true }
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
