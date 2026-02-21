import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get unresolved inventory conflicts
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const conflicts = await db.inventorySyncLog.findMany({
            where: {
                conflict: true,
                resolved: false
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        stock: true
                    }
                },
                updatedByUser: {
                    select: {
                        fullName: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ conflicts })
    } catch (error) {
        console.error('Get inventory conflicts error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch conflicts' },
            { status: 500 }
        )
    }
}

/**
 * Resolve inventory conflict (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminId = 'admin-id' // Replace with actual JWT verification
        const { conflictId } = await request.json()

        await db.inventorySyncLog.update({
            where: { id: conflictId },
            data: {
                resolved: true,
                resolvedBy: adminId,
                resolvedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Resolve conflict error:', error)
        return NextResponse.json(
            { error: 'Failed to resolve conflict' },
            { status: 500 }
        )
    }
}
