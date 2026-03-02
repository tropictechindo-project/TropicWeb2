import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'
import { sendGoogleReport } from '@/lib/reporting/googleReporter'

export const dynamic = 'force-dynamic'

/**
 * Complete a Delivery (Atomic Transaction)
 *
 * 1. Checks ownership and not already completed
 * 2. Updates Delivery Status & completedAt
 * 3. Releases Vehicle
 * 4. Logs to DeliveryLogs
 * 5. Syncs Inventory & Writes to InventorySyncLog
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
        const body = await request.json()
        const { notes, photoProof } = body

        // 1. Validation
        const delivery = await db.delivery.findUnique({
            where: { id },
            include: {
                claimedByWorker: true,
                invoice: true,
                items: {
                    include: {
                        rentalItem: true
                    }
                }
            }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }

        if (delivery.claimedByWorkerId !== workerId) {
            return NextResponse.json({ error: 'Not your delivery' }, { status: 403 })
        }

        if (delivery.status === 'COMPLETED') {
            return NextResponse.json({ error: 'Already completed' }, { status: 400 })
        }

        const now = new Date()

        // Atomic Transaction
        const updatedDelivery = await db.$transaction(async (tx) => {
            // A. Update Delivery
            const updated = await tx.delivery.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: now
                }
            })

            // B. Release Vehicle if assigned
            if (delivery.vehicleId) {
                await tx.vehicle.update({
                    where: { id: delivery.vehicleId },
                    data: {
                        status: 'AVAILABLE',
                        currentDeliveryId: null
                    }
                })
            }

            // C. Insert Delivery Log with photo/note proofs
            await tx.deliveryLog.create({
                data: {
                    deliveryId: id,
                    createdByUserId: workerId,
                    role: 'WORKER',
                    eventType: 'COMPLETED',
                    newValue: JSON.parse(JSON.stringify({
                        notes: notes || 'Delivery completed',
                        photoUrl: photoProof || null
                    }))
                }
            })

            // D. Atomic Inventory Sync & Unit Status Transition
            for (const item of delivery.items) {
                if (item.rentalItem?.unitId) {
                    const newStatus = delivery.deliveryType === 'DROPOFF' ? 'RENTED' : 'AVAILABLE';

                    // 1. Update Unit Status
                    await tx.productUnit.update({
                        where: { id: item.rentalItem.unitId },
                        data: {
                            status: newStatus as any,
                            // If pickup, clear the assigned order to make it truly available
                            ...(delivery.deliveryType === 'PICKUP' ? { assignedOrderId: null } : {})
                        }
                    });

                    // 2. Log History
                    await tx.unitHistory.create({
                        data: {
                            unitId: item.rentalItem.unitId,
                            oldStatus: delivery.deliveryType === 'DROPOFF' ? 'RESERVED' : 'RENTED',
                            newStatus: newStatus,
                            details: `Automated status update via ${delivery.deliveryType} completion (Delivery ID: ${id})`,
                            userId: workerId
                        }
                    });

                    // 3. Inventory Log (Audit)
                    if (item.rentalItem.variantId) {
                        await tx.inventorySyncLog.create({
                            data: {
                                productId: item.rentalItem.variantId,
                                oldQuantity: item.quantity,
                                newQuantity: item.quantity,
                                updatedBy: workerId,
                                source: 'WORKER',
                                conflict: false,
                                resolved: true
                            }
                        });
                    }
                }
            }

            // E. Auto-Trigger PICKUP logic if DROPOFF is completed
            if (delivery.deliveryType === 'DROPOFF' && delivery.invoiceId) {
                // Check if a PICKUP already exists to avoid duplicates (Crush Logic Protection)
                const existingPickup = await tx.delivery.findFirst({
                    where: {
                        invoiceId: delivery.invoiceId,
                        deliveryType: 'PICKUP'
                    }
                })

                if (!existingPickup) {
                    await tx.delivery.create({
                        data: {
                            invoiceId: delivery.invoiceId,
                            deliveryMethod: 'INTERNAL',
                            deliveryType: 'PICKUP',
                            status: 'QUEUED',
                        }
                    })

                    // Notify workers about the upcoming pickup
                    await tx.spiNotification.create({
                        data: {
                            role: 'WORKER',
                            type: 'DELIVERY_UPDATE',
                            title: 'New Pickup Task',
                            message: `A new pickup is now queued for Invoice ${delivery.invoice?.invoiceNumber || 'Manual'}.`,
                            link: '/dashboard/worker',
                        }
                    })
                }
            }

            return updated
        })

        // Execute reporting background task WITHOUT returning it or blocking response
        sendGoogleReport('DELIVERY', {
            deliveryId: updatedDelivery.id,
            orderId: delivery.invoice?.orderId || updatedDelivery.invoiceId || 'unknown',
            workerId: workerId,
            workerName: delivery.claimedByWorker?.fullName || delivery.claimedByWorker?.username || 'Unknown Worker',
            completedAt: updatedDelivery.completedAt?.toISOString() || new Date().toISOString(),
            notes: notes || "Completed cleanly"
        }).catch(err => console.error("Google Reporter Error:", err));

        await logActivity({
            userId: workerId,
            action: 'COMPLETE_DELIVERY',
            entity: 'DELIVERY',
            details: `Worker ${workerId} completed delivery ${id}`
        })

        return NextResponse.json({ success: true, delivery: updatedDelivery })
    } catch (error: any) {
        console.error('Complete delivery error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
