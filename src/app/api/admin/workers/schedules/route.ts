import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = searchParams.get('limit')

        const schedules = await db.workerSchedule.findMany({
            orderBy: { scheduledDate: 'desc' },
            take: limit ? parseInt(limit) : 50,
            include: {
                worker: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                order: {
                    select: {
                        orderNumber: true
                    }
                }
            }
        })

        return NextResponse.json({ schedules })
    } catch (error) {
        console.error('Error fetching worker schedules:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
