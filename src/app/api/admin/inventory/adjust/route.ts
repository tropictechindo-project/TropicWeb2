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
        const { variantId, total, reserved } = body

        if (!variantId) {
            return NextResponse.json({ error: 'Missing variantId' }, { status: 400 })
        }

        const variant = await db.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true }
        })

        if (!variant) {
            return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }

        await db.$transaction(async (tx) => {
            await tx.productVariant.update({
                where: { id: variantId },
                data: {
                    stockQuantity: total !== undefined ? total : undefined,
                    reservedQuantity: reserved !== undefined ? reserved : undefined
                }
            })
        })

        await logActivity({
            userId: adminId,
            action: 'RECONCILE_INVENTORY',
            entity: 'PRODUCT',
            details: `Reconciled variant stock for ${variant.product.name} (${variant.color}). Total: ${total}, Reserved: ${reserved}`
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Inventory Adjustment Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
