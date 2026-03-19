import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'OPERATOR')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const productId = searchParams.get('productId')
        const status = searchParams.get('status') || 'available'

        const where: any = {}
        if (productId) where.productId = productId
        if (status) where.status = status

        const units = await db.inventoryUnit.findMany({
            where,
            orderBy: { serialCode: 'asc' },
            include: {
                product: { select: { name: true } }
            }
        })

        // 1. Safe standalone query to bypass missing back-relation locks in types
        const unitIds = units.map((u: any) => u.id)
        const orderItems = await (db as any).orderItem.findMany({
            where: { inventoryUnitId: { in: unitIds } },
            select: { price: true, createdAt: true, inventoryUnitId: true }
        })

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const mappedUnits = units.map((u: any) => {
            // Filter standalone queried order-items linked to this discrete asset
            const matchedItems = orderItems.filter((item: any) => item.inventoryUnitId === u.id)

            if (matchedItems.length === 0) {
                const isIdleWithCost = u.status === 'available' && Number(u.installmentRemaining || 0) > 0;
                return {
                    ...u,
                    total_earned: null,
                    monthly_revenue: null,
                    remaining_balance: null,
                    cashflow: null,
                    payoff_progress: null,
                    insightLabel: isIdleWithCost ? "Idle (cost active)" : "No revenue yet"
                }
            }

            const total_earned = matchedItems.reduce((sum: number, item: any) => sum + Number(item.price), 0)
            
            const monthly_revenue = matchedItems
                .filter((item: any) => item.createdAt && new Date(item.createdAt) >= startOfMonth)
                .reduce((sum: number, item: any) => sum + Number(item.price), 0)

            const purchase_price = u.purchasePrice ? Number(u.purchasePrice) : null
            const installment_monthly = u.installmentMonthly ? Number(u.installmentMonthly) : null

            // Part 3 & 6 Guards: Safe Financial calculation
            const isPurchaseValid = purchase_price !== null && purchase_price > 0;
            const isInstallmentValid = installment_monthly !== null && installment_monthly > 0;

            const remaining_balance = isPurchaseValid ? purchase_price - total_earned : null
            const cashflow = isInstallmentValid ? monthly_revenue - installment_monthly : null
            const payoff_progress = isPurchaseValid ? total_earned / purchase_price : null

            // 2. Computed Asset insights Labels
            let insightLabel: string | null = null;
            if (cashflow !== null && cashflow < 0) {
                insightLabel = "Negative cashflow"
            } else if (u.status === 'available' && Number(u.installmentRemaining || 0) > 0) {
                insightLabel = "Idle (cost active)"
            }

            return {
                ...u,
                revenue: total_earned, // backwards compatibility
                total_earned,
                monthly_revenue,
                remaining_balance,
                cashflow,
                payoff_progress,
                insightLabel
            }
        })

        // 3. Assignment Suggestion Sort Prioritization (Part 4)
        if (productId) {
            mappedUnits.sort((a: any, b: any) => {
                if (a.productId === productId && b.productId !== productId) return -1
                if (a.productId !== productId && b.productId === productId) return 1
                return 0
            })
        }

        return NextResponse.json(mappedUnits)
    } catch (error: any) {
        console.error('[GET_INVENTORY_UNITS] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch inventory units' }, { status: 500 })
    }
}
