import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Get single delivery
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await the params to satisfy Next.js 15 routing types
        const { id } = await params

        const delivery = await db.delivery.findUnique({
            where: { id },
            include: {
                invoice: {
                    include: {
                        order: {
                            include: { user: true }
                        }
                    }
                },
                claimedByWorker: true,
                vehicle: true,
                items: {
                    include: {
                        rentalItem: {
                            include: { variant: { include: { product: true } } }
                        }
                    }
                },
                logs: {
                    orderBy: { createdAt: 'desc' }
                },
                editLogs: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!delivery) {
            return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }

        return NextResponse.json({ delivery })
    } catch (error) {
        console.error('Get delivery error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

/**
 * Admin forcefully update a delivery (Admin Override)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const delivery = await db.delivery.update({
            where: { id },
            data: {
                status: body.status,
                deliveryMethod: body.deliveryMethod,
                eta: body.eta ? new Date(body.eta) : undefined,
                claimedByWorkerId: body.claimedByWorkerId !== undefined ? body.claimedByWorkerId : body.claimedBy,
                vehicleId: body.vehicleId
            }
        })

        await logActivity({
            userId: 'admin', // Typically extracted from JWT
            action: 'UPDATE_DELIVERY',
            entity: 'DELIVERY',
            details: `Admin force updated delivery ${id} to status ${body.status}`
        })

        return NextResponse.json({ success: true, delivery })
    } catch (error: any) {
        console.error('Update delivery error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * Admin cancel delivery
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const delivery = await db.delivery.update({
            where: { id },
            data: { status: 'CANCELED' }
        })

        await logActivity({
            userId: 'admin',
            action: 'CANCEL_DELIVERY',
            entity: 'DELIVERY',
            details: `Delivery ${id} canceled by Admin`
        })

        return NextResponse.json({ success: true, delivery })
    } catch (error: any) {
        console.error('Cancel delivery error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
