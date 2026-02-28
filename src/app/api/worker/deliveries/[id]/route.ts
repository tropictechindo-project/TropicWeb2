import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Get details of a single delivery
 */
export async function GET(
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

        if (!payload || payload.role !== 'WORKER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const workerId = payload.userId
        const { id } = await params

        const delivery = await db.delivery.findUnique({
            where: { id },
            include: {
                invoice: {
                    include: {
                        order: {
                            include: { user: true }
                        }
                    }
                },
                vehicle: true,
                items: {
                    include: {
                        rentalItem: {
                            include: { variant: { include: { product: true } } }
                        }
                    }
                },
                logs: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }

        // Must be queued or claimed by this worker
        if (delivery.status !== 'QUEUED' && delivery.claimedByWorkerId !== workerId) {
            return NextResponse.json({ error: 'Forbidden. Claimed by another worker.' }, { status: 403 })
        }

        return NextResponse.json({ delivery })
    } catch (error) {
        console.error('Get single delivery error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

/**
 * Update delivery status during transport (PAUSED, DELAYED, OUT_FOR_DELIVERY)
 */
export async function PATCH(
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

        if (!payload || payload.role !== 'WORKER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const workerId = payload.userId
        const { id } = await params
        const body = await request.json()
        const { status, eta, notes, action, logId } = body

        // Verify ownership
        const existing = await db.delivery.findUnique({
            where: { id },
            include: { logs: true }
        })
        if (!existing || existing.claimedByWorkerId !== workerId) {
            return NextResponse.json({ error: 'Unauthorized. Not your delivery.' }, { status: 403 })
        }

        // Handle specific action: EDIT_LOG
        if (action === 'EDIT_LOG') {
            if (!logId) return NextResponse.json({ error: 'logId is required' }, { status: 400 })

            const log = await db.deliveryLog.findUnique({ where: { id: logId } })
            if (!log || log.deliveryId !== id || log.createdByUserId !== workerId) {
                return NextResponse.json({ error: 'Log not found or unauthorized' }, { status: 404 })
            }

            // check 12 hour window
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
            if (new Date(log.createdAt) < twelveHoursAgo) {
                return NextResponse.json({ error: 'Edit window (12h) closed' }, { status: 400 })
            }

            const updatedLog = await db.deliveryLog.update({
                where: { id: logId },
                data: {
                    newValue: JSON.parse(JSON.stringify({
                        ...(log.newValue as any || {}),
                        notes: notes,
                        editedAt: new Date()
                    }))
                }
            })

            return NextResponse.json({ success: true, log: updatedLog })
        }

        // Prevent modifying finished deliveries for normal status updates
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELED') {
            return NextResponse.json({ error: 'Cannot modify a finished delivery status.' }, { status: 400 })
        }

        const data: any = {}
        if (status) data.status = status
        if (eta) data.eta = new Date(eta)

        const result = await db.$transaction(async (tx) => {
            const updated = await tx.delivery.update({
                where: { id },
                data
            })

            await tx.deliveryLog.create({
                data: {
                    deliveryId: id,
                    createdByUserId: workerId,
                    role: 'WORKER',
                    eventType: action || status || 'UPDATED_ETA',
                    newValue: { notes: notes || 'Worker manually updated delivery' }
                }
            })

            return updated
        })

        await logActivity({
            userId: workerId,
            action: 'UPDATE_DELIVERY',
            entity: 'DELIVERY',
            details: `Worker ${workerId} updated delivery ${id} status to ${status || 'ETA'}`
        })

        return NextResponse.json({ success: true, delivery: result })
    } catch (error: any) {
        console.error('Update delivery error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
