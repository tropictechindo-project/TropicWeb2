import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const delivery = await db.delivery.findUnique({
            where: { trackingCode: params.code },
            select: {
                id: true,
                status: true,
                latitude: true,
                longitude: true,
                lastLocationUpdate: true
            }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return NextResponse.json({ delivery })
    } catch (error) {
        console.error('Fetch tracking location error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
