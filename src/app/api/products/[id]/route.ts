import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productRaw = await db.product.findUnique({
      where: { id },
      include: { variants: true }
    })

    if (!productRaw) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const stock = productRaw.variants.reduce((acc, v) => acc + (v.stockQuantity - v.reservedQuantity), 0)
    const product = { ...productRaw, stock: Math.max(0, stock) }

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
    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        monthlyPrice: data.monthlyPrice,
        imageUrl: data.imageUrl,
      },
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
    const { id } = await params
    await db.product.delete({
      where: { id },
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
