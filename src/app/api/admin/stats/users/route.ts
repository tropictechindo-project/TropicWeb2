import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const count = await db.user.count()
        return NextResponse.json({ count })
    } catch (error) {
        console.error('Error fetching user stats:', error)
        return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 })
    }
}
