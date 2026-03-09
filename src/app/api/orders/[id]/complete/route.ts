import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'


export const dynamic = 'force-dynamic'

// PATCH /api/orders/[id]/complete
// Marks an order as COMPLETED.
// Called by: the customer (confirms they received gear) OR Admin/Operator (force-complete)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { userId, role } = { userId: auth.userId, role: auth.role }

        const { id } = await params
        const order = await db.order.findUnique({
            where: { id },
            include: { invoices: { include: { deliveries: true } } }
        })

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

        // Authorization: must be the order owner OR admin/operator
        const isOwner = order.userId === userId
        const isStaff = role === 'ADMIN' || role === 'OPERATOR'
        if (!isOwner && !isStaff) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (order.status === 'COMPLETED') {
            return NextResponse.json({ error: 'Order is already completed' }, { status: 409 })
        }

        await db.$transaction(async (tx) => {
            // Mark order completed
            await tx.order.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedByUserId: userId,
                    completedAt: new Date(),
                }
            })

            // Mark any associated delivery as completed too (if not already)
            const delivery = order.invoices?.[0]?.deliveries?.[0]
            if (delivery && delivery.status !== 'COMPLETED') {
                await tx.delivery.update({
                    where: { id: delivery.id },
                    data: { status: 'COMPLETED' }
                })
            }

            // Note: Unit lifecycle is driven by delivery completion, not order status.
            // DROPOFF completion → RESERVED→RENTED (worker endpoint)
            // PICKUP completion → RENTED→AVAILABLE (worker endpoint)
            // No unit transitions needed here.

            // Notify the customer (if admin/operator completed it)
            if (isStaff && !isOwner && order.userId) {
                await tx.spiNotification.create({
                    data: {
                        userId: order.userId,
                        role: 'USER',
                        type: 'ORDER_COMPLETED',
                        title: 'Order Completed ✅',
                        message: `Your order ${order.orderNumber} has been marked as complete.`,
                        link: '/dashboard/user'
                    }
                })
            }
        })

        return NextResponse.json({ success: true, message: 'Order marked as completed.' })

    } catch (error: any) {
        console.error('[ORDER_COMPLETE] Error:', error)
        return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
    }
}
