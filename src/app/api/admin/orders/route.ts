import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = searchParams.get('limit')

        const orders = await db.order.findMany({
            include: {
                user: {
                    select: { fullName: true, email: true }
                },
                rentalItems: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : undefined
        })
        return NextResponse.json({ orders })
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}
