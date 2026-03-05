import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Background Cron Job: Auto-Confirm Deliveries
 * Marks ARRIVED deliveries older than 1 hour as COMPLETED
 */
export async function GET(request: NextRequest) {
    try {
        // Optional: Simple security check for cron trigger (e.g., header or query param)
        // In a real production app, use Vercel Cron headers or an API secret

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        const arrivedDeliveries = await db.delivery.findMany({
            where: {
                status: 'ARRIVED',
                completedAt: { lte: oneHourAgo } // Using completedAt as the arrival time marker
            }
        })

        if (arrivedDeliveries.length === 0) {
            return NextResponse.json({ message: 'No deliveries to auto-confirm' })
        }

        const stats = { confirmed: 0, errors: 0 }

        for (const delivery of arrivedDeliveries) {
            try {
                await db.$transaction(async (tx) => {
                    await tx.delivery.update({
                        where: { id: delivery.id },
                        data: {
                            status: 'COMPLETED',
                            userConfirmedAt: new Date(),
                            userConfirmedBy: 'SYSTEM_CRON'
                        }
                    })

                    if (delivery.invoiceId) {
                        await tx.invoice.update({
                            where: { id: delivery.invoiceId },
                            data: {
                                status: 'COMPLETED',
                                completedAt: new Date(),
                                completedByUserId: 'SYSTEM_CRON'
                            }
                        })
                    }

                    await tx.deliveryLog.create({
                        data: {
                            deliveryId: delivery.id,
                            role: 'SYSTEM',
                            eventType: 'COMPLETED',
                            newValue: { notes: 'Auto-confirmed by system after 1 hour' }
                        }
                    })
                })
                stats.confirmed++
            } catch (err) {
                console.error(`Failed to auto-confirm delivery ${delivery.id}:`, err)
                stats.errors++
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${arrivedDeliveries.length} deliveries`,
            stats
        })
    } catch (error: any) {
        console.error('Auto-confirm cron error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
