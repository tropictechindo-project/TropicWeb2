import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (!user || user.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { entityId, entityType } = await req.json()

        if (!entityId || !entityType) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Create dismissal record
        await db.notificationDismissal.create({
            data: {
                userId: user.id,
                entityId,
                entityType
            }
        })

        // If it's a system notification, we might want to mark it as read too, or just rely on dismissal table
        if (entityType === 'SYSTEM') {
            await db.systemNotification.updateMany({
                where: { id: entityId },
                data: { isRead: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Dismiss notification error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
