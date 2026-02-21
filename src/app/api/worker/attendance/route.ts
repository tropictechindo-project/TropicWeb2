import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * Get worker's attendance records
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workerId = user.id

        const attendance = await db.workerAttendance.findMany({
            where: { workerId },
            orderBy: {
                date: 'desc'
            },
            take: 90 // Last 3 months
        })

        return NextResponse.json({ attendance })
    } catch (error) {
        console.error('Get attendance error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch attendance' },
            { status: 500 }
        )
    }
}

/**
 * Submit daily attendance (check-in)
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workerId = user.id
        const { notes } = await request.json()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if already checked in today
        const existing = await db.workerAttendance.findUnique({
            where: {
                workerId_date: {
                    workerId,
                    date: today
                }
            }
        })

        if (existing) {
            // Update check-out time
            const updated = await db.workerAttendance.update({
                where: { id: existing.id },
                data: {
                    checkOutTime: new Date(),
                    notes
                }
            })

            await logActivity({
                userId: workerId,
                action: 'CHECK_OUT',
                entity: 'WORKER_ATTENDANCE',
                details: 'Checked out'
            })

            return NextResponse.json({ success: true, attendance: updated, action: 'checkout' })
        }

        // Determine status based on time
        const now = new Date()
        const hour = now.getHours()
        const status = hour > 9 ? 'LATE' : 'PRESENT' // Late if after 9 AM

        // Create new attendance record
        const attendance = await db.workerAttendance.create({
            data: {
                workerId,
                date: today,
                status,
                checkInTime: now,
                notes
            }
        })

        await logActivity({
            userId: workerId,
            action: 'CHECK_IN',
            entity: 'WORKER_ATTENDANCE',
            details: `Checked in at ${now.toLocaleTimeString()}`
        })

        return NextResponse.json({ success: true, attendance, action: 'checkin' })
    } catch (error) {
        console.error('Submit attendance error:', error)
        return NextResponse.json(
            { error: 'Failed to submit attendance' },
            { status: 500 }
        )
    }
}
