import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Update a vehicle
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
        const { name, type, status, currentDeliveryId } = body

        const vehicle = await db.vehicle.update({
            where: { id },
            data: {
                name,
                type,
                status,
                currentDeliveryId
            }
        })

        return NextResponse.json({ success: true, vehicle })
    } catch (error: any) {
        console.error('Update vehicle error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update vehicle' }, { status: 500 })
    }
}

/**
 * Delete a vehicle
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

        // Ensure vehicle is not tied to active delivery
        const vehicle = await db.vehicle.findUnique({ where: { id } })
        if (vehicle?.status === 'IN_USE') {
            return NextResponse.json({ error: 'Cannot delete a vehicle currently in use' }, { status: 400 })
        }

        await db.vehicle.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete vehicle error:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete vehicle' }, { status: 500 })
    }
}
