import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * POST: Mark system notifications as read by entityId and type
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user || !['ADMIN', 'OPERATOR'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { entityId, type } = await request.json()

        if (!entityId || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        await db.systemNotification.updateMany({
            where: {
                entityId,
                type,
                isRead: false
            },
            data: {
                isRead: true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Mark read error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
