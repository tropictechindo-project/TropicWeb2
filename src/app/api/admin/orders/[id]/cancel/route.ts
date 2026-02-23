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

            // 1. Restore Units (Release Reservation/Rent)
            const rentalItems = await tx.rentalItem.findMany({
                where: { orderId },
                include: { unit: true }
            })

            for (const item of rentalItems) {
                if (item.unitId) {
                    const unit = item.unit
                    await tx.productUnit.update({
                        where: { id: item.unitId },
                        data: {
                            status: 'AVAILABLE',
                            assignedOrderId: null
                        }
                    })

                    await tx.unitHistory.create({
                        data: {
                            unitId: item.unitId,
                            oldStatus: unit?.status || 'RESERVED',
                            newStatus: 'AVAILABLE',
                            details: `Order #${order.orderNumber} cancelled by admin. Unit released.`,
                            userId: payload.userId
                        }
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
                    details: `Order #${order.orderNumber} cancelled by admin. Units restored for ${rentalItems.length} items.`
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
