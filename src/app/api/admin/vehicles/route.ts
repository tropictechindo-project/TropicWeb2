import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Get all vehicles
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const vehicles = await db.vehicle.findMany({
            include: {
                deliveries: {
                    where: { status: { notIn: ['COMPLETED', 'CANCELED'] } },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        invoiceId: true,
                        claimedByWorker: { select: { fullName: true } }
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        const mappedVehicles = vehicles.map(v => ({
            ...v,
            currentDelivery: v.deliveries[0] || null
        }))

        return NextResponse.json({ vehicles: mappedVehicles })
    } catch (error) {
        console.error('Get vehicles error:', error)
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }
}

/**
 * Create a new vehicle
 */
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, type } = body

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
        }

        const vehicle = await db.vehicle.create({
            data: {
                name,
                type,
                status: 'AVAILABLE'
            }
        })

        return NextResponse.json({ success: true, vehicle })
    } catch (error: any) {
        console.error('Create vehicle error:', error)
        return NextResponse.json({ error: error.message || 'Failed to create vehicle' }, { status: 500 })
    }
}
