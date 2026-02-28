import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Worker claims a queued delivery
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

        if (!payload || payload.role !== 'WORKER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const workerId = payload.userId
        const { id } = await params
        const { vehicleId } = await request.json()

        if (!vehicleId) {
            return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 })
        }

        // Run as transaction to prevent race conditions
        const result = await db.$transaction(async (tx) => {
            // 1. Lock the delivery
            const delivery = await tx.delivery.findUnique({
                where: { id }
            })

            if (!delivery) {
                throw new Error('Delivery not found')
            }

            if (delivery.status !== 'QUEUED' || delivery.claimedByWorkerId) {
                throw new Error('Delivery is no longer available in the queue')
            }

            // 2. Lock the vehicle
            const vehicle = await tx.vehicle.findUnique({
                where: { id: vehicleId }
            })

            if (!vehicle) {
                throw new Error('Vehicle not found')
            }

            if (vehicle.status !== 'AVAILABLE') {
                throw new Error('Vehicle is currently in use')
            }

            // 3. Update Delivery
            const updatedDelivery = await tx.delivery.update({
                where: { id },
                data: {
                    status: 'CLAIMED',
                    claimedByWorkerId: workerId,
                    vehicleId: vehicleId
                }
            })

            // 4. Update Vehicle
            await tx.vehicle.update({
                where: { id: vehicleId },
                data: {
                    status: 'IN_USE',
                    currentDeliveryId: id
                }
            })

            // 5. Add Log
            await tx.deliveryLog.create({
                data: {
                    deliveryId: id,
                    createdByUserId: workerId,
                    role: 'WORKER',
                    eventType: 'CLAIMED',
                    newValue: JSON.parse(JSON.stringify({ notes: `Claimed with vehicle: ${vehicle.name}` }))
                }
            })

            return updatedDelivery
        })

        await logActivity({
            userId: workerId,
            action: 'CLAIM_DELIVERY',
            entity: 'DELIVERY',
            details: `Worker claimed delivery ${id}`
        })

        return NextResponse.json({ success: true, delivery: result })

    } catch (error: any) {
        console.error('Claim delivery error:', error)
        if (['Delivery is no longer available in the queue', 'Vehicle is currently in use'].includes(error.message)) {
            return NextResponse.json({ error: error.message }, { status: 409 })
        }
        return NextResponse.json({ error: error.message || 'Failed to claim delivery' }, { status: 500 })
    }
}
