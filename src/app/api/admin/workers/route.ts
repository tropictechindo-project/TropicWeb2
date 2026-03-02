import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get all workers with their stats and recent activity
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workers = await db.user.findMany({
            where: { role: 'WORKER' },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                whatsapp: true,
                isActive: true,
                createdAt: true,
                claimedDeliveries: {
                    select: {
                        id: true,
                        status: true,
                        eta: true,
                        invoice: {
                            select: {
                                invoiceNumber: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 5
                },
                workerAttendance: {
                    select: {
                        date: true,
                        status: true,
                        checkInTime: true,
                        checkOutTime: true
                    },
                    orderBy: {
                        date: 'desc'
                    },
                    take: 30 // Last 30 days
                },
                receivedNotifications: {
                    where: { isRead: false },
                    select: { id: true }
                }
            },
            orderBy: {
                fullName: 'asc'
            }
        })

        // Calculate stats for each worker
        const workersWithStats = workers.map(worker => {
            const totalJobs = worker.claimedDeliveries.length
            const completedJobs = worker.claimedDeliveries.filter(s => s.status === 'COMPLETED').length
            const pendingJobs = worker.claimedDeliveries.filter(s => ['CLAIMED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED'].includes(s.status)).length
            const attendanceRate = calculateAttendanceRate(worker.workerAttendance)

            // Map claimedDeliveries to workerSchedules for frontend compatibility
            const workerSchedules = worker.claimedDeliveries.map(d => ({
                id: d.id,
                status: d.status,
                scheduledDate: d.eta, // Map eta to scheduledDate
                order: {
                    orderNumber: d.invoice?.invoiceNumber || 'N/A' // Map invoiceNumber to orderNumber
                }
            }))

            return {
                ...worker,
                workerSchedules, // Inject the mapped array
                stats: {
                    totalJobs,
                    completedJobs,
                    pendingJobs,
                    attendanceRate,
                    unreadNotifications: worker.receivedNotifications.length
                }
            }
        })

        return NextResponse.json({ workers: workersWithStats })
    } catch (error) {
        console.error('Get workers error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch workers' },
            { status: 500 }
        )
    }
}

/**
 * Create a new worker account (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { fullName, email, whatsapp, password } = await request.json()

        // Check if email already exists
        const existing = await db.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        // 1. Sync to Supabase Auth first
        const { syncUserToSupabase } = await import('@/lib/auth/supabase-admin')
        const supabaseId = await syncUserToSupabase(email, password, {
            full_name: fullName,
            role: 'WORKER'
        })

        if (!supabaseId) {
            return NextResponse.json({
                error: 'Failed to sync worker to Supabase Auth. Check SUPABASE_SERVICE_ROLE_KEY.'
            }, { status: 500 })
        }

        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash(password, 10)

        const worker = await db.user.create({
            data: {
                id: supabaseId, // Keep IDs in sync
                username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                email,
                password: hashedPassword,
                plainPassword: password, // Store for admin view
                fullName,
                whatsapp,
                role: 'WORKER',
                isActive: true,
                isVerified: true
            }
        })

        return NextResponse.json({
            success: true, worker: {
                id: worker.id,
                email: worker.email,
                fullName: worker.fullName
            }
        })
    } catch (error) {
        console.error('Create worker error:', error)
        return NextResponse.json(
            { error: 'Failed to create worker' },
            { status: 500 }
        )
    }
}

function calculateAttendanceRate(attendance: any[]) {
    if (attendance.length === 0) return 0
    const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
    return Math.round((present / attendance.length) * 100)
}
