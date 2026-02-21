import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

/**
 * Get individual worker details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const worker = await db.user.findUnique({
            where: { id: params.id, role: 'WORKER' },
            include: {
                workerSchedules: {
                    include: {
                        order: {
                            select: {
                                orderNumber: true,
                                totalAmount: true,
                                startDate: true,
                                endDate: true
                            }
                        }
                    },
                    orderBy: {
                        scheduledDate: 'desc'
                    }
                },
                workerAttendance: {
                    orderBy: {
                        date: 'desc'
                    },
                    take: 90 // Last 3 months
                },
                activityLogs: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 50
                }
            }
        })

        if (!worker) {
            return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
        }

        return NextResponse.json({ worker })
    } catch (error) {
        console.error('Get worker details error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch worker details' },
            { status: 500 }
        )
    }
}

/**
 * Update worker details (admin only)
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

        const data = await request.json()
        const { fullName, email, whatsapp, isActive } = data

        const worker = await db.user.update({
            where: { id: params.id, role: 'WORKER' },
            data: {
                fullName,
                email,
                whatsapp,
                isActive
            }
        })

        await logActivity({
            userId: 'admin-id', // Replace with actual admin ID
            action: 'UPDATE_WORKER',
            entity: 'USER',
            details: `Updated worker ${worker.fullName}`
        })

        return NextResponse.json({ success: true, worker })
    } catch (error) {
        console.error('Update worker error:', error)
        return NextResponse.json(
            { error: 'Failed to update worker' },
            { status: 500 }
        )
    }
}

/**
 * Assign job to worker
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, scheduledDate, notes } = await request.json()
        const adminId = 'admin-id' // Replace with actual admin ID from JWT
        const targetDate = new Date(scheduledDate)

        // Atomic Transaction for Assignment
        const result = await db.$transaction(async (tx) => {
            // 1. Overlap Validation
            const existingSchedule = await tx.workerSchedule.findFirst({
                where: {
                    workerId: params.id,
                    scheduledDate: targetDate,
                    status: { notIn: ['CANCELLED', 'FINISHED'] }
                }
            })

            if (existingSchedule) {
                throw new Error('Worker already has a job on this date')
            }

            // 2. Create Schedule
            const schedule = await tx.workerSchedule.create({
                data: {
                    workerId: params.id,
                    orderId,
                    assignedBy: adminId,
                    scheduledDate: targetDate,
                    notes,
                    status: 'PENDING'
                }
            })

            // 3. Notifications
            await tx.workerNotification.create({
                data: {
                    workerId: params.id,
                    fromAdminId: adminId,
                    type: 'JOB_ASSIGNED',
                    title: 'New Job Assigned',
                    message: `You have been assigned a new delivery job scheduled for ${targetDate.toLocaleDateString()}`,
                    isRead: false
                }
            })

            // 4. Update Order Status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    deliveryStatus: 'SCHEDULED'
                }
            })

            return schedule
        })

        await logActivity({
            userId: adminId,
            action: 'ASSIGN_JOB',
            entity: 'WORKER_SCHEDULE',
            details: `Assigned job to worker ${params.id}`
        })

        return NextResponse.json({ success: true, schedule: result })
    } catch (error: any) {
        console.error('Assign job error:', error)
        if (error.message === 'Worker already has a job on this date') {
            return NextResponse.json({ error: error.message }, { status: 409 })
        }
        return NextResponse.json(
            { error: 'Failed to assign job' },
            { status: 500 }
        )
    }
}
