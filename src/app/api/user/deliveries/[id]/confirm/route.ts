import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * User Confirm Delivery Receipt
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = payload.userId
        const { id } = await params

        // 1. Validation
        const delivery = await db.delivery.findUnique({
            where: { id },
            include: {
                invoice: true
            }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }

        // Only the user who owns the invoice (if set) or someone with enough permissions can confirm
        if (delivery.invoice?.userId && delivery.invoice.userId !== userId && !['ADMIN', 'OPERATOR'].includes(payload.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (delivery.status === 'COMPLETED') {
            return NextResponse.json({ error: 'Already completed' }, { status: 400 })
        }

        // Must be in ARRIVED status for user to confirm usually, 
        // but we allow confirmation from claimed/out_for_delivery too for flexibility
        const allowedStatuses = ['ARRIVED', 'OUT_FOR_DELIVERY', 'CLAIMED']
        if (!allowedStatuses.includes(delivery.status)) {
            return NextResponse.json({ error: 'Delivery is not in a confirmable state' }, { status: 400 })
        }

        const now = new Date()

        // Atomic Transaction
        const updatedDelivery = await db.$transaction(async (tx) => {
            // A. Update Delivery
            const updated = await tx.delivery.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    userConfirmedAt: now,
                    userConfirmedBy: userId
                }
            })

            // B. Also update Invoice completedAt if it's the primary delivery
            if (delivery.invoiceId) {
                await tx.invoice.update({
                    where: { id: delivery.invoiceId },
                    data: {
                        completedAt: now,
                        completedByUserId: userId,
                        status: 'COMPLETED'
                    }
                })
            }

            // C. Insert Delivery Log
            await tx.deliveryLog.create({
                data: {
                    deliveryId: id,
                    createdByUserId: userId,
                    role: payload.role as any,
                    eventType: 'COMPLETED',
                    newValue: { notes: 'User confirmed receipt' }
                }
            })

            return updated
        })

        await logActivity({
            userId,
            action: 'CONFIRM_DELIVERY',
            entity: 'DELIVERY',
            details: `User ${userId} confirmed delivery ${id}`
        })

        return NextResponse.json({ success: true, delivery: updatedDelivery })
    } catch (error: any) {
        console.error('Confirm delivery error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
