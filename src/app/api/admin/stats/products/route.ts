import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const count = await db.product.count()
        return NextResponse.json({ count })
    } catch (error) {
        console.error('Error fetching product stats:', error)
        return NextResponse.json({ error: 'Failed to fetch product stats' }, { status: 500 })
    }
}
