import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/orders/[id]/cancel
 * Admin endpoint to cancel an order and RESTORE stock
 */
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

        const { id: orderId } = await params

        const result = await db.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { rentalItems: true }
            })

            if (!order) throw new Error('Order not found')
            if (order.status === 'CANCELLED') throw new Error('Order is already cancelled')

            // 1. Restore Stock (Release Reservation)
            for (const item of order.rentalItems) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { reservedQuantity: { decrement: item.quantity || 0 } }
                    })
                }
            }

            // 2. Update Order Status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            })

            // 3. Log Activity
            await tx.activityLog.create({
                data: {
                    userId: payload.userId,
                    action: 'CANCEL_ORDER',
                    entity: 'ORDER',
                    details: `Order #${order.orderNumber} cancelled by admin. Stock restored for ${order.rentalItems.length} items.`
                }
            })

            return updatedOrder
        })

        return NextResponse.json({ success: true, order: result })
    } catch (error: any) {
        console.error('Order cancellation error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
