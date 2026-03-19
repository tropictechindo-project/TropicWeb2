import { db } from './db'

/**
 * Safe Revenue Hook (Read-Only)
 * Sums the price of all order items assigned to a specific inventory unit
 */
export async function getUnitRevenue(unitId: string): Promise<number> {
    try {
        const aggregate = await (db as any).orderItem.aggregate({
            where: { inventoryUnitId: unitId },
            _sum: { price: true }
        })
        return Number(aggregate._sum.price || 0)
    } catch (error) {
        console.error('[getUnitRevenue] Error:', error)
        return 0
    }
}

/**
 * Product-Level ROI Aggregation (Step 8)
 * Groups linked inventory units by product_id and returns aggregated financial yields.
 */
export async function getProductRoiStats() {
    try {
        const anyDb = db as any;

        // 1. Get all linked order items to extract revenues per unitId
        const linkedItems = await anyDb.orderItem.findMany({
            where: { inventoryUnitId: { not: null } },
            select: { inventoryUnitId: true, price: true }
        })

        const unitRevenues: Record<string, number> = {}
        linkedItems.forEach((item: any) => {
            const id = item.inventoryUnitId
            unitRevenues[id] = (unitRevenues[id] || 0) + Number(item.price || 0)
        })

        const unitIds = Object.keys(unitRevenues)
        if (unitIds.length === 0) return []

        // 2. Fetch inventory items matching those linked IDs
        const units = await anyDb.inventoryUnit.findMany({
            where: { id: { in: unitIds } },
            include: { product: { select: { name: true } } }
        })

        // 3. Aggregate In Memory by ProductId
        const productStats: Record<string, {
            productId: string,
            name: string,
            total_revenue: number,
            total_units: number,
            total_installment: number,
            total_profit: number
        }> = {}

        units.forEach((unit: any) => {
            const pId = unit.productId
            const name = unit.product?.name || "Unknown Product"
            const revenue = unitRevenues[unit.id] || 0
            const installment = Number(unit.installmentMonthly || 0)

            if (!productStats[pId]) {
                productStats[pId] = {
                    productId: pId,
                    name,
                    total_revenue: 0,
                    total_units: 0,
                    total_installment: 0,
                    total_profit: 0
                }
            }

            productStats[pId].total_revenue += revenue
            productStats[pId].total_units += 1
            productStats[pId].total_installment += installment
            productStats[pId].total_profit += (revenue - installment)
        })

        return Object.values(productStats)
        
    } catch (error) {
        console.error('[getProductRoiStats] Error aggregates failing non-blocking:', error)
        return []
    }
}
