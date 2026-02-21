
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
