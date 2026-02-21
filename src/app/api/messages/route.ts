import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * GET: retrieve messages with a specific user
 * params: otherUserId
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const otherUserId = searchParams.get('userId')

        if (!otherUserId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        const messages = await (db as any).message.findMany({
            where: {
                OR: [
                    { senderId: user.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: user.id }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true
                    }
                }
            }
        })

        // Mark as read
        await (db as any).message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: user.id,
                isRead: false
            },
            data: {
                isRead: true
            }
        })

        return NextResponse.json({ success: true, messages })
    } catch (error) {
        console.error('Fetch messages error:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

/**
 * POST: send a message
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { receiverId, content } = await request.json()

        if (!receiverId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const message = await (db as any).message.create({
            data: {
                senderId: user.id,
                receiverId,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true
                    }
                }
            }
        })

        return NextResponse.json({ success: true, message })
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
