import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * GET: Get group messages
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { groupId: string } }
) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const groupId = params.groupId

        // Verify user is a member of the group
        const membership = await (db as any).chatGroupMember.findFirst({
            where: {
                groupId,
                userId: user.id
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
        }

        const messages = await (db as any).groupMessage.findMany({
            where: { groupId },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return NextResponse.json({ success: true, messages })
    } catch (error) {
        console.error('Get group messages error:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

/**
 * POST: Send message to group
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { groupId: string } }
) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const groupId = params.groupId
        const { content } = await request.json()

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 })
        }

        // Verify user is a member of the group
        const membership = await (db as any).chatGroupMember.findFirst({
            where: {
                groupId,
                userId: user.id
            }
        })

        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
        }

        const message = await (db as any).groupMessage.create({
            data: {
                groupId,
                senderId: user.id,
                content: content.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        profileImage: true,
                        role: true
                    }
                }
            }
        })

        // Update group's updatedAt timestamp
        await (db as any).chatGroup.update({
            where: { id: groupId },
            data: { updatedAt: new Date() }
        })

        return NextResponse.json({ success: true, message })
    } catch (error) {
        console.error('Send group message error:', error)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
