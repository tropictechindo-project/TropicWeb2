import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'
import { sendGoogleReport } from '@/lib/reporting/googleReporter'

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

            // --- Multi-Worker Claim Logic (Max 5) ---
            const existingClaims = await tx.delivery.findMany({
                where: {
                    invoiceId: delivery.invoiceId,
                    deliveryType: delivery.deliveryType,
                    status: { not: 'QUEUED' }
                }
            })

            const MAX_CLAIMS = 5;

            if (existingClaims.length >= MAX_CLAIMS) {
                // Failsafe: if max is hit, destroy the Pool Master so it disappears from queue
                await tx.delivery.delete({ where: { id } })
                throw new Error(`Maximum of ${MAX_CLAIMS} workers have already claimed this order`)
            }

            const alreadyClaimed = existingClaims.some(d => d.claimedByWorkerId === workerId)
            if (alreadyClaimed) {
                throw new Error('You have already claimed this delivery')
            }

            // 2. Lock the vehicle (Limit to 5 active deliveries per vehicle)
            const vehicle = await tx.vehicle.findUnique({
                where: { id: vehicleId }
            })

            if (!vehicle) throw new Error('Vehicle not found')
            if (vehicle.status === 'MAINTENANCE') throw new Error('Vehicle is under maintenance')
            if (vehicle.status === 'RETURNING') throw new Error('Vehicle is currently returning to HQ')

            const activeVehicleDeliveries = await tx.delivery.count({
                where: {
                    vehicleId,
                    status: { in: ['CLAIMED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED'] }
                }
            })

            if (activeVehicleDeliveries >= MAX_CLAIMS) {
                throw new Error(`Vehicle has reached maximum capacity (${MAX_CLAIMS} active deliveries)`)
            }

            // 3. Create a Clone of the Delivery for this Worker (Leave the master QUEUED)
            const clonedDelivery = await tx.delivery.create({
                data: {
                    invoiceId: delivery.invoiceId,
                    deliveryMethod: delivery.deliveryMethod,
                    deliveryType: delivery.deliveryType,
                    latitude: delivery.latitude,
                    longitude: delivery.longitude,
                    status: 'CLAIMED',
                    claimedByWorkerId: workerId,
                    vehicleId: vehicleId
                }
            })

            // If this was the 5th worker (so now there are 5 claims), destroy the Pool Master
            if (existingClaims.length + 1 >= MAX_CLAIMS) {
                await tx.delivery.delete({ where: { id } })
            }

            // 4. Update Vehicle
            await tx.vehicle.update({
                where: { id: vehicleId },
                data: {
                    status: 'IN_USE',
                    currentDeliveryId: clonedDelivery.id // This keeps track of the LATEST delivery, but we handle multi-use via count
                }
            })

            // 5. Add Log
            await tx.deliveryLog.create({
                data: {
                    deliveryId: clonedDelivery.id,
                    createdByUserId: workerId,
                    role: 'WORKER',
                    eventType: 'CLAIMED',
                    newValue: JSON.parse(JSON.stringify({ notes: `Claimed with vehicle: ${vehicle.name} (Worker ${existingClaims.length + 1} of ${MAX_CLAIMS})` }))
                }
            })

            return clonedDelivery
        })

        await logActivity({
            userId: workerId,
            action: 'CLAIM_DELIVERY',
            entity: 'DELIVERY',
            details: `Worker claimed delivery ${id}`
        })

        // 6. Send to Google Sheets (non-blocking)
        setTimeout(async () => {
            try {
                await sendGoogleReport('DELIVERY', {
                    deliveryId: id,
                    workerId: workerId,
                    workerName: payload.fullName || 'Worker',
                    status: 'CLAIMED',
                    vehicleId: vehicleId,
                    timestamp: new Date().toISOString()
                })
            } catch (e) { console.error('[CLAIM_DELIVERY] Google Report error:', e) }
        }, 0)

        return NextResponse.json({ success: true, delivery: result })

    } catch (error: any) {
        console.error('Claim delivery error:', error)
        if (['Delivery is no longer available in the queue', 'Vehicle is currently in use', 'Vehicle is currently returning to HQ'].includes(error.message)) {
            return NextResponse.json({ error: error.message }, { status: 409 })
        }
        return NextResponse.json({ error: error.message || 'Failed to claim delivery' }, { status: 500 })
    }
}
