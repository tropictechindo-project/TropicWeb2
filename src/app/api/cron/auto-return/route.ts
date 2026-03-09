import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/auto-return
 *
 * Daily safety cron: Reclaim rented units when rental period has expired.
 *
 * Finds all ProductUnits with status='RENTED' where the linked order's
 * endDate < now(), then transitions them back to AVAILABLE.
 *
 * This is a safety net — the normal flow is:
 *   PICKUP delivery completion → RENTED → AVAILABLE
 * But if the pickup never happens, this cron prevents units from being
 * stuck in RENTED forever.
 */
export async function GET(req: Request) {
    try {
        // Optional: Verify cron secret
        const authHeader = req.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 })
        }

        const now = new Date()
        let unitsReturned = 0

        // Find all units that are RENTED and linked to expired orders
        const rentedUnits = await db.productUnit.findMany({
            where: {
                status: 'RENTED',
                assignedOrder: {
                    endDate: { lt: now },
                    status: { notIn: ['COMPLETED', 'CANCELLED'] }
                }
            },
            include: {
                assignedOrder: { select: { id: true, orderNumber: true, endDate: true } },
                variant: { select: { productId: true } }
            }
        })

        if (rentedUnits.length === 0) {
            await db.systemJobLog.create({
                data: {
                    jobName: 'AUTO_RETURN_CRON',
                    status: 'SUCCESS',
                    message: 'No expired rentals found. All units accounted for.'
                }
            })
            return NextResponse.json({ success: true, unitsReturned: 0 })
        }

        // Process each expired unit in a transaction
        await db.$transaction(async (tx) => {
            for (const unit of rentedUnits) {
                // Return unit to stock
                await tx.productUnit.update({
                    where: { id: unit.id },
                    data: {
                        status: 'AVAILABLE',
                        assignedOrderId: null
                    }
                })

                // Log unit history
                await tx.unitHistory.create({
                    data: {
                        unitId: unit.id,
                        oldStatus: 'RENTED',
                        newStatus: 'AVAILABLE',
                        details: `AUTO_RETURN_TIMEOUT: Rental period expired (order ${unit.assignedOrder?.orderNumber || 'unknown'}, ended ${unit.assignedOrder?.endDate?.toISOString() || 'unknown'}). Unit auto-returned to stock.`,
                    }
                })

                // Inventory sync log
                if (unit.variant?.productId) {
                    await tx.inventorySyncLog.create({
                        data: {
                            productId: unit.variant.productId,
                            oldQuantity: 0,
                            newQuantity: 1,
                            updatedBy: '00000000-0000-0000-0000-000000000000', // SYSTEM
                            source: 'ADMIN',
                            conflict: false,
                            resolved: true
                        }
                    })
                }

                // Notify admins/operators
                await tx.spiNotification.create({
                    data: {
                        role: 'ADMIN',
                        type: 'INVENTORY_AUTO_RETURN',
                        title: 'Auto-Return: Unit Reclaimed',
                        message: `Unit ${unit.serialNumber} (Order: ${unit.assignedOrder?.orderNumber || 'unknown'}) was auto-returned to stock. Rental period expired.`,
                        link: '/admin/inventory'
                    }
                })

                unitsReturned++
            }
        })

        // Log job success
        await db.systemJobLog.create({
            data: {
                jobName: 'AUTO_RETURN_CRON',
                status: 'SUCCESS',
                message: `Auto-returned ${unitsReturned} unit(s) from expired rentals.`
            }
        })

        return NextResponse.json({ success: true, unitsReturned })

    } catch (error: any) {
        console.error('[AUTO_RETURN_CRON] Error:', error)

        await db.systemJobLog.create({
            data: {
                jobName: 'AUTO_RETURN_CRON',
                status: 'FAILED',
                message: error.message
            }
        }).catch(() => { }) // Don't fail the error handler

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
