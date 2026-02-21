import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  try {
    const products = await db.product.findMany({
      where: category ? { category } : undefined,
      include: {
        _count: {
          select: {
            productUnits: {
              where: { status: 'AVAILABLE' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedProducts = products.map(p => ({
      ...p,
      stock: p.stock || 0
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    // Basic validation could go here
    const product = await db.product.create({
      data: json,
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
