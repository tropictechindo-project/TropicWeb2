import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { logActivity } from '@/lib/logger'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await verifyAuth(request)
        const adminId = auth?.userId
        const { id } = params
        const body = await request.json()
        const { status, condition, serialNumber, assetTag, purchasePrice } = body

        const currentUnit = await db.productUnit.findUnique({
            where: { id },
            include: { variant: { include: { product: true } } }
        })

        if (!currentUnit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
        }

        const updatedUnit = await db.$transaction(async (tx) => {
            const unit = await tx.productUnit.update({
                where: { id },
                data: {
                    status: status || undefined,
                    condition: condition || undefined,
                    serialNumber: serialNumber || undefined,
                    assetTag: assetTag || undefined,
                    purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : undefined
                }
            })

            // Log history if status or condition changed
            if (status !== currentUnit.status || condition !== currentUnit.condition) {
                await tx.unitHistory.create({
                    data: {
                        unitId: id,
                        oldStatus: currentUnit.status,
                        newStatus: status || currentUnit.status,
                        oldCondition: currentUnit.condition,
                        newCondition: condition || currentUnit.condition,
                        details: `Status/Condition updated manually by admin`,
                        userId: adminId
                    }
                })
            }

            return unit
        })

        await logActivity({
            userId: adminId,
            action: 'UPDATE_INVENTORY_UNIT',
            entity: 'ProductUnit',
            details: `Updated unit ${updatedUnit.assetTag} (${currentUnit.variant.product.name})`
        })

        return NextResponse.json({ success: true, unit: updatedUnit })

    } catch (error) {
        console.error('Error updating unit:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
