import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

/**
 * Get individual worker details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const worker = await db.user.findUnique({
            where: { id, role: 'WORKER' },
            include: {
                claimedDeliveries: {
                    include: {
                        invoice: {
                            select: {
                                invoiceNumber: true,
                                total: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const data = await request.json()
        const { fullName, email, whatsapp, isActive } = data

        const worker = await db.user.update({
            where: { id, role: 'WORKER' },
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
