import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/logger'
import { verifyToken } from '@/lib/auth/utils'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        let adminId: string | undefined
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const payload = await verifyToken(token)
            if (payload) adminId = payload.userId
        }

        const body = await request.json()
        const { variantId, total, reserved, numUnitsToAdd, condition } = body

        if (!variantId) {
            return NextResponse.json({ error: 'Missing variantId' }, { status: 400 })
        }

        const variant = await db.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true, _count: { select: { units: true } } }
        })

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }

        // Determine how many units to add
        let unitsToAdd = 0
        if (numUnitsToAdd) {
            unitsToAdd = numUnitsToAdd
        } else if (total !== undefined) {
            const currentTotal = variant._count.units
            unitsToAdd = Math.max(0, total - currentTotal)
        }

        const newUnits = await db.$transaction(async (tx) => {
            const units: any[] = []
            for (let i = 0; i < unitsToAdd; i++) {
                const serialNumber = `SN-${variant.sku}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

                const unit = await tx.productUnit.create({
                    data: {
                        variantId: variant.id,
                        serialNumber,
                        status: 'AVAILABLE',
                        condition: condition || 'GOOD'
                    }
                })

                await tx.unitHistory.create({
                    data: {
                        unitId: unit.id,
                        newStatus: 'AVAILABLE',
                        newCondition: condition || 'GOOD',
                        details: numUnitsToAdd ? 'Initial batch unit creation' : 'Manual stock reconciliation addition',
                        userId: adminId
                    }
                })

                // Add inventory sync log for accountability
                await tx.inventorySyncLog.create({
                    data: {
                        productId: variant.productId,
                        oldQuantity: variant._count.units + i,
                        newQuantity: variant._count.units + i + 1,
                        updatedBy: adminId || '00000000-0000-0000-0000-000000000000',
                        source: 'ADMIN',
                        details: `Reconciliation: Added unit ${serialNumber}.`,
                        conflict: false,
                        resolved: true
                    }
                })

                units.push(unit)
            }
            return units
        })

        await logActivity({
            userId: adminId,
            action: 'INVENTORY_RECONCILE',
            entity: 'PRODUCT',
            details: `Reconciled ${variant.product.name} (${variant.color}). Added ${unitsToAdd} units. Target Total: ${total || 'N/A'}`
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Inventory Adjustment Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
