import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || !['ADMIN', 'OPERATOR'].includes(payload.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [unreadOrders, unreadDeliveries] = await Promise.all([
            db.order.count({
                where: { status: 'PAID' } // Standard unread order definition for badges
            }),
            db.delivery.count({
                where: { status: 'QUEUED' } // Unclaimed deliveries
            })
        ])

        return NextResponse.json({
            success: true,
            unreadOrders,
            unreadDeliveries
        })
    } catch (error) {
        console.error('Fetch Unread Counts Error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
