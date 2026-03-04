import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export async function PATCH(
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

        if (!payload || !['WORKER', 'ADMIN', 'OPERATOR'].includes(payload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { latitude, longitude } = await request.json()

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
        }

        const delivery = await db.delivery.findUnique({
            where: { id: params.id }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }

        // Only allow updating if worker owns it or is admin/operator
        if (payload.role === 'WORKER' && delivery.claimedByWorkerId !== payload.userId) {
            return NextResponse.json({ error: 'Not authorized for this delivery' }, { status: 403 })
        }

        const updatedDelivery = await db.delivery.update({
            where: { id: params.id },
            data: {
                latitude,
                longitude,
                lastLocationUpdate: new Date(),
            }
        })

        return NextResponse.json({ success: true, delivery: updatedDelivery })

    } catch (error) {
        console.error('Update delivery location error:', error)
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }
}
