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

        // 1. Count Direct Messages (Peer-to-Peer)
        const directCount = await (db as any).message.count({
            where: {
                receiverId: user.id,
                isRead: false
            }
        })

        // 2. Count Group Messages (Support etc.)
        // First get the user's group memberships and their last read timestamps
        const groupMemberships = await (db as any).chatGroupMember.findMany({
            where: { userId: user.id },
            select: { groupId: true, lastReadAt: true }
        })

        let groupCount = 0
        if (groupMemberships.length > 0) {
            // Count messages in each group created after the user's lastReadAt
            const counts = await Promise.all(groupMemberships.map((m: any) =>
                (db as any).groupMessage.count({
                    where: {
                        groupId: m.groupId,
                        senderId: { not: user.id }, // Don't count own messages
                        createdAt: { gt: m.lastReadAt || new Date(0) }
                    }
                })
            ))
            groupCount = counts.reduce((sum, c) => sum + c, 0)
        }

        return NextResponse.json({ success: true, count: directCount + groupCount })
    } catch (error) {
        console.error('Fetch unread count error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
