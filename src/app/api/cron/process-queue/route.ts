
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Job Queue Processor
 * Triggered by Cron (e.g. every minute)
 */
export async function GET(request: Request) {
    try {
        // Simple lock mechanism via DB transaction
        const result = await db.$transaction(async (tx) => {
            // 1. Fetch one PENDING job
            const job = await tx.jobQueue.findFirst({
                where: {
                    status: 'PENDING',
                    runAt: { lte: new Date() }
                },
                orderBy: { createdAt: 'asc' }
            })

            if (!job) return null

            // 2. Lock it (Mark PROCESSING)
            await tx.jobQueue.update({
                where: { id: job.id },
                data: { status: 'PROCESSING', processedAt: new Date() }
            })

            return job
        })

        if (!result) {
            return NextResponse.json({ processed: 0, message: 'No jobs pending' })
        }

        console.log(`Processing Job ${result.id} [${result.type}]`)

        try {
            // PROCESS JOB HANDLER (Router)
            if (result.type === 'EMAIL') {
                // await sendEmail(result.payload)
                console.log('Simulating Email Send:', result.payload)
            } else if (result.type === 'NOTIFICATION') {
                // await sendNotification(result.payload)
            } else if (result.type === 'CHECK_DELIVERY_CLAIM') {
                const { deliveryId } = result.payload as { deliveryId: string }
                const delivery = await db.delivery.findUnique({
                    where: { id: deliveryId },
                    include: { invoice: true }
                })

                if (delivery && delivery.status === 'QUEUED') {
                    // AUTO-CLAIM LOGIC
                    // 1. Find the first active worker to assign as a fallback
                    const fallbackWorker = await db.user.findFirst({
                        where: { role: 'WORKER', isActive: true },
                        orderBy: { createdAt: 'asc' }
                    })

                    if (fallbackWorker) {
                        // 2. Auto-assign the delivery
                        await db.delivery.update({
                            where: { id: delivery.id },
                            data: {
                                claimedByWorkerId: fallbackWorker.id,
                                status: 'CLAIMED',
                                claimedAt: new Date()
                            }
                        })

                        // 3. Log the automated action
                        await db.deliveryLog.create({
                            data: {
                                deliveryId: delivery.id,
                                eventType: 'AUTO_CLAIMED',
                                newValue: { workerId: fallbackWorker.id, workerName: fallbackWorker.fullName },
                                role: 'SYSTEM'
                            }
                        })

                        console.log(`Delivery ${deliveryId} automatically claimed by ${fallbackWorker.fullName}`)
                    } else {
                        // Original fallback: send alert to admin if no worker available
                        const { sendEmail } = await import('@/lib/email')
                        await sendEmail({
                            to: 'contact@tropictech.online',
                            subject: `🚨 UNCLAIMED JOB ALERT: Delivery ${deliveryId.substring(0, 8)}`,
                            html: `
                                <h2>Unclaimed Delivery Job - No Workers Available</h2>
                                <p>Delivery for Invoice <strong>${delivery.invoice?.invoiceNumber || 'N/A'}</strong> has been unclaimed for over 1 hour.</p>
                                <p>System tried to auto-claim but no active workers were found.</p>
                                <hr/>
                                <p>Tropic Tech Dispatch System</p>
                            `
                        })
                    }
                }
            }

            // Mark DONE
            await db.jobQueue.update({
                where: { id: result.id },
                data: { status: 'DONE' }
            })

        } catch (jobError: any) {
            console.error(`Job ${result.id} failed:`, jobError)

            // Handle Retry Logic
            if (result.retryCount < 3) {
                const nextRun = new Date()
                nextRun.setMinutes(nextRun.getMinutes() + 5) // Retry in 5 mins (exponential backoff ideally)

                await db.jobQueue.update({
                    where: { id: result.id },
                    data: {
                        status: 'PENDING',
                        retryCount: { increment: 1 },
                        runAt: nextRun,
                        error: jobError.message
                    }
                })
            } else {
                await db.jobQueue.update({
                    where: { id: result.id },
                    data: {
                        status: 'FAILED',
                        error: jobError.message
                    }
                })
            }
        }

        return NextResponse.json({ processed: 1, jobId: result.id })

    } catch (error) {
        console.error('Queue Processor Error:', error)
        return NextResponse.json({ error: 'Failed to process queue' }, { status: 500 })
    }
}
