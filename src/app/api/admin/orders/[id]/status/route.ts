import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { status } = await request.json()
        const { id } = await params

        const order = await db.order.update({
            where: { id },
            data: { status },
            include: { user: true }
        })

        // Log activity
        await logActivity({
            userId: payload.userId,
            action: 'UPDATE_ORDER_STATUS',
            entity: 'ORDER',
            details: `Order #${order.orderNumber} status updated to ${status} by admin.`
        })

        return NextResponse.json({ order })
    } catch (error) {
        console.error('Error updating order status:', error)
        return NextResponse.json(
            { error: 'Failed to update order status' },
            { status: 500 }
        )
    }
}
