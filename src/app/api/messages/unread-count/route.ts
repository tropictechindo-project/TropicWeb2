// Last update: 2026-02-09T22:45:46
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * GET: retrieve unread message count for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const count = await (db as any).message.count({
            where: {
                receiverId: user.id,
                isRead: false
            }
        })

        return NextResponse.json({ success: true, count })
    } catch (error) {
        console.error('Fetch unread count error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
