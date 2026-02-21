import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { notifications } = body // Expecting array of { entityId, source/type }

        if (!Array.isArray(notifications)) {
            return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
        }

        const dismissalData = notifications.map((n: any) => ({
            userId: payload.userId,
            entityId: n.entityId,
            entityType: n.source || n.entityType || 'SYSTEM'
        }))

        // Use createMany if supported (Postgres supports it)
        await db.notificationDismissal.createMany({
            data: dismissalData,
            skipDuplicates: true
        })

        return NextResponse.json({ success: true, count: dismissalData.length })

    } catch (error) {
        console.error('Dismiss all error:', error)
        return NextResponse.json(
            { error: 'Failed to dismiss notifications' },
            { status: 500 }
        )
    }
}
