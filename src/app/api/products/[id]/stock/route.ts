import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { quantity } = await request.json()

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: { stock: quantity },
    })

    return NextResponse.json({ product, message: 'Stock updated successfully' })
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
