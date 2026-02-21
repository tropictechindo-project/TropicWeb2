
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body // AVAILABLE, IN_USE, DAMAGED

        const unit = await db.productUnit.update({
            where: { id },
            data: { status }
        })

        // Sync Stock Cache
        const availableCount = await db.productUnit.count({
            where: { productId: unit.productId, status: 'AVAILABLE' }
        })

        await db.product.update({
            where: { id: unit.productId },
            data: { stock: availableCount }
        })

        return NextResponse.json({ unit })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        // Get unit first to know product
        const unit = await db.productUnit.findUnique({ where: { id } })
        if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        await db.productUnit.delete({ where: { id } })

        // Sync Stock Cache
        const availableCount = await db.productUnit.count({
            where: { productId: unit.productId, status: 'AVAILABLE' }
        })

        await db.product.update({
            where: { id: unit.productId },
            data: { stock: availableCount }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete unit' }, { status: 500 })
    }
}
