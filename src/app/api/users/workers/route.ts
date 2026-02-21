import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const workers = await db.user.findMany({
            where: {
                role: 'WORKER'
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                profileImage: true,
                role: true
            },
            orderBy: {
                fullName: 'asc'
            }
        })

        return NextResponse.json({ workers })
    } catch (error) {
        console.error('Error fetching workers:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
