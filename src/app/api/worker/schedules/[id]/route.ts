import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

/**
 * Update job schedule status (worker updates their job progress)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { status, workerNotes } = await request.json()
        const workerId = 'worker-id' // Replace with actual JWT verification

        // Validate status
        const validStatuses = ['PENDING', 'ONGOING', 'FINISHED', 'DELAYED', 'CANCELLED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const schedule = await db.workerSchedule.update({
            where: { id: params.id },
            data: {
                status,
                workerNotes,
                updatedAt: new Date()
            },
            include: {
                order: true
            }
        })

        // Update order delivery status based on job status
        let deliveryStatus = schedule.order.deliveryStatus
        if (status === 'ONGOING') {
            deliveryStatus = 'IN_PROGRESS'
        } else if (status === 'FINISHED') {
            deliveryStatus = 'DELIVERED'
        } else if (status === 'CANCELLED') {
            deliveryStatus = 'FAILED'
        }

        await db.order.update({
            where: { id: schedule.orderId },
            data: { deliveryStatus }
        })

        // Log activity
        await logActivity({
            userId: workerId,
            action: 'UPDATE_JOB_STATUS',
            entity: 'WORKER_SCHEDULE',
            details: `Updated job status to ${status}`
        })

        return NextResponse.json({ success: true, schedule })
    } catch (error) {
        console.error('Update schedule error:', error)
        return NextResponse.json(
            { error: 'Failed to update schedule' },
            { status: 500 }
        )
    }
}
