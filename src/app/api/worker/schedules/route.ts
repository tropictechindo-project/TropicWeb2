// Last update: 2026-02-09T22:45:46
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * Get worker's schedules/jobs
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user || (user.role !== 'WORKER' && user.role !== 'ADMIN')) {
            console.log('Worker schedules: Unauthorized user:', user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workerId = user.id
        console.log('Worker schedules: Fetching for worker:', workerId)

        const schedules = await db.workerSchedule.findMany({
            where: { workerId },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                whatsapp: true,
                                baliAddress: true,
                                profileImage: true
                            } as any
                        },
                        rentalItems: {
                            include: {
                                product: true,
                                rentalPackage: true
                            }
                        }
                    }
                },
                assignedByUser: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'desc'
            }
        })

        console.log('Worker schedules: Found schedules:', schedules.length)

        return NextResponse.json({ schedules })
    } catch (error) {
        console.error('Get worker schedules error:', error)
        return NextResponse.json(
            // @ts-ignore
            { error: 'Failed to fetch schedules', details: error.message },
            { status: 500 }
        )
    }
}
