// Last update: 2026-02-09T22:45:46
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { logActivity } from '@/lib/logger'

/**
 * Send message/notification to worker
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await verifyAuth(request)
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, message } = await request.json()
        const adminId = user.id

        // Create in new Message model for chat history
        await (db as any).message.create({
            data: {
                senderId: adminId,
                receiverId: params.id,
                content: `${title ? `[${title}] ` : ''}${message}`
            }
        })

        // Also create a Notification for the worker's dashboard alerts
        const notification = await db.workerNotification.create({
            data: {
                workerId: params.id,
                fromAdminId: adminId,
                type: 'ADMIN_MESSAGE',
                title: title || 'New Message from Admin',
                message,
                isRead: false
            }
        })

        await logActivity({
            userId: adminId,
            action: 'SEND_MESSAGE',
            entity: 'WORKER_NOTIFICATION',
            details: `Sent message to worker ${params.id}: ${title}`
        })

        return NextResponse.json({ success: true, notification })
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        )
    }
}
