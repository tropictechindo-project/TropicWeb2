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

        const result = await db.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id },
                data: { status },
                include: {
                    user: true,
                    rentalItems: {
                        include: { unit: true }
                    }
                }
            })

            // If COMPLETED, return units to AVAILABLE
            if (status === 'COMPLETED') {
                for (const item of order.rentalItems) {
                    if (item.unitId) {
                        const unit = item.unit
                        await tx.productUnit.update({
                            where: { id: item.unitId },
                            data: {
                                status: 'AVAILABLE',
                                lastServiceDate: new Date(),
                                assignedOrderId: null
                            }
                        })

                        await tx.unitHistory.create({
                            data: {
                                unitId: item.unitId,
                                oldStatus: unit?.status || 'RENTED',
                                newStatus: 'AVAILABLE',
                                details: `Order #${order.orderNumber} completed. Unit returned to stock.`,
                                userId: payload.userId
                            }
                        })
                    }
                }
            }

            // Also handle CANCELLED if it happens through this generic route
            if (status === 'CANCELLED') {
                for (const item of order.rentalItems) {
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
                                details: `Order #${order.orderNumber} cancelled. Unit released.`,
                                userId: payload.userId
                            }
                        })
                    }
                }
            }

            return order
        })

        const order = result

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
