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
        const { variantId, numUnitsToAdd, condition } = body

        if (!variantId || !numUnitsToAdd) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const variant = await db.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true }
        })

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }

        const newUnits = await db.$transaction(async (tx) => {
            const units: any[] = []
            for (let i = 0; i < numUnitsToAdd; i++) {
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
                        details: 'Initial batch unit creation',
                        userId: adminId
                    }
                })
                units.push(unit)
            }
            return units
        })

        await logActivity({
            userId: adminId,
            action: 'CREATE_UNITS',
            entity: 'PRODUCT',
            details: `Added ${numUnitsToAdd} units for ${variant.product.name} (${variant.color})`
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Inventory Adjustment Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
