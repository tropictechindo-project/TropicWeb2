import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { type, reason } = await req.json()

        if (!['EXTENSION', 'RETURN', 'SWAP', 'SERVICE'].includes(type)) {
            return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
        }

        const rentalItem = await db.rentalItem.findUnique({
            where: { id: params.id },
            include: { order: true }
        })

        if (!rentalItem || rentalItem.order.userId !== payload.userId) {
            return NextResponse.json({ error: 'Rental item not found or unauthorized' }, { status: 404 })
        }

        // Check for existing pending requests of the same type
        const existing = await db.itemRequest.findFirst({
            where: {
                rentalItemId: params.id,
                status: 'PENDING'
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'There is already a pending request for this item' }, { status: 400 })
        }

        const itemRequest = await db.itemRequest.create({
            data: {
                rentalItemId: params.id,
                userId: payload.userId,
                type,
                reason,
                status: 'PENDING'
            }
        })

        return NextResponse.json({ success: true, itemRequest })

    } catch (error) {
        console.error('Item request creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
