import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

/**
 * GET: List user's groups
 */
export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const groups = await (db as any).chatGroup.findMany({
            where: {
                OR: [
                    {
                        members: {
                            some: {
                                userId: user.id
                            }
                        }
                    },
                    // Safety net: Workers and Admins should see all Support Groups
                    ...(user.role === 'WORKER' || user.role === 'ADMIN' ? [{
                        type: 'USER_SUPPORT'
                    }] : [])
                ]
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImage: true,
                                role: true
                            }
                        }
                    }
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        content: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return NextResponse.json({ success: true, groups })
    } catch (error) {
        console.error('Get groups error:', error)
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }
}

/**
 * POST: Create new group (admin only for system groups)
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, type, memberIds } = await request.json()

        // System groups can only be created by admins
        if (type === 'WORKER_GROUP' && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only admins can create worker groups' }, { status: 403 })
        }

        const group = await (db as any).chatGroup.create({
            data: {
                name,
                type,
                members: {
                    create: memberIds.map((memberId: string, index: number) => ({
                        userId: memberId,
                        role: index === 0 ? 'ADMIN' : 'MEMBER'
                    }))
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                profileImage: true,
                                role: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({ success: true, group })
    } catch (error) {
        console.error('Create group error:', error)
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }
}
