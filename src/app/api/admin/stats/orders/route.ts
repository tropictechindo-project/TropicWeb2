import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const count = await db.order.count()
        const revenueResult = await db.order.aggregate({
            _sum: {
                totalAmount: true,
            },
        })

        return NextResponse.json({
            count,
            revenue: revenueResult._sum.totalAmount || 0
        })
    } catch (error) {
        console.error('Error fetching order stats:', error)
        return NextResponse.json({ error: 'Failed to fetch order stats' }, { status: 500 })
    }
}
