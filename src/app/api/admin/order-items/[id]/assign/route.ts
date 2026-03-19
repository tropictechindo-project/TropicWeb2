import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req)
        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'OPERATOR')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: orderItemId } = await params
        const { unitId } = await req.json()

        if (!unitId) {
            return NextResponse.json({ error: 'Missing unitId' }, { status: 400 })
        }

        const result = await db.$transaction(async (tx) => {
            const anyTx = tx as any; // Cast for custom model updates fallback
            
            // Include order with first invoice if available
            const item = await anyTx.orderItem.findUnique({ 
                where: { id: orderItemId },
                include: {
                    order: {
                        include: {
                            invoices: {
                                select: { id: true },
                                take: 1
                            }
                        }
                    }
                }
            })
            if (!item) throw new Error('Order item not found')
            
            // Part 1 & 2 Guard: Immutable Link
            if (item.inventoryUnitId) {
                console.warn(`[ASSIGN_CONFLICT] OrderItem ${orderItemId} is already linked to Unit ${item.inventoryUnitId}`);
                throw new Error('Order item already assigned')
            }

            const unit = await anyTx.inventoryUnit.findUnique({ where: { id: unitId } })
            if (!unit) throw new Error('Inventory unit not found')
            if (unit.status !== 'available') throw new Error('Inventory unit already assigned')

            // A. Update OrderItem
            await anyTx.orderItem.update({
                where: { id: orderItemId },
                data: { inventoryUnitId: unitId }
            })

            // B. Update InventoryUnit Status
            await anyTx.inventoryUnit.update({
                where: { id: unitId },
                data: { status: 'rented' }
            })

            return { 
                orderItemId, 
                unitId,
                orderId: item.orderId,
                invoiceId: item.order?.invoices?.[0]?.id || null,
                productId: item.productId,
                serialCode: unit.serialCode,
                nameSnapshot: item.nameSnapshot
            }
        })

        // Structured Non-Blocking Log (Step 7)
        try {
            console.log({
                type: "SYSTEM_EVENT",
                event: "ORDER_ITEM_ASSIGNED_TO_INVENTORY",
                payload: {
                    order_item_id: orderItemId,
                    inventory_unit_id: unitId,
                    order_id: result.orderId,
                    invoice_id: result.invoiceId,
                    assigned_by: auth.userId || auth.email || "system",
                    timestamp: new Date().toISOString(),
                    product_id: result.productId,
                    serial_code: result.serialCode,
                    order_item_name: result.nameSnapshot
                }
            })
        } catch (logError) {
            console.warn('[ASSIGN_LOG_ERROR] Logging event failed non-blocking:', logError)
        }

        return NextResponse.json({ success: true, message: 'Asset assigned successfully', data: result })
    } catch (error: any) {
        console.error('[ASSIGN_UNIT] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to assign unit' }, { status: 500 })
    }
}
