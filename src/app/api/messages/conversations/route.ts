// Last update: 2026-02-09T22:45:46
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * GET: retrieve all unique conversations for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all messages where user is sender or receiver
        const messages = await (db as any).message.findMany({
            where: {
                OR: [
                    { senderId: user.id },
                    { receiverId: user.id }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        role: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Group by the "other" user
        const conversationsMap = new Map()

        messages.forEach(msg => {
            const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender
            if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unreadCount: (msg.receiverId === user.id && !msg.isRead) ? 1 : 0
                })
            } else {
                if (msg.receiverId === user.id && !msg.isRead) {
                    const conv = conversationsMap.get(otherUser.id)
                    conv.unreadCount += 1
                }
            }
        })

        const conversations = Array.from(conversationsMap.values())

        return NextResponse.json({ success: true, conversations })
    } catch (error) {
        console.error('Fetch conversations error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
