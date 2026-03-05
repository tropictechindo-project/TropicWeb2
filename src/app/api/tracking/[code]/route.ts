import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        let delivery = await db.delivery.findUnique({
            where: { trackingCode: params.code },
            select: {
                id: true,
                status: true,
                latitude: true,
                longitude: true,
                lastLocationUpdate: true,
                trackingCode: true
            }
        })

        if (!delivery) {
            delivery = await db.delivery.findFirst({
                where: {
                    OR: [
                        { invoice: { invoiceNumber: params.code } },
                        { invoice: { order: { orderNumber: params.code } } }
                    ]
                },
                select: {
                    id: true,
                    status: true,
                    latitude: true,
                    longitude: true,
                    lastLocationUpdate: true,
                    trackingCode: true
                },
                orderBy: { createdAt: 'desc' }
            })
        }

        if (!delivery) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        return NextResponse.json({ delivery })
    } catch (error) {
        console.error('Fetch tracking location error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
