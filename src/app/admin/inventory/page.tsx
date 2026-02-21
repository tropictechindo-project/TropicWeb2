import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { InventoryClient } from "@/components/admin/inventory/InventoryClient"

export default async function AdminInventoryPage() {
    const [units, products] = await Promise.all([
        db.productUnit.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: {
                    select: { name: true, category: true }
                }
            }
        }),
        db.product.findMany({
            include: {
                _count: {
                    select: { productUnits: true }
                },
                productUnits: {
                    select: { status: true }
                }
            }
        })
    ])

    const formattedUnits = units.map(u => ({
        id: u.id,
        unitCode: u.unitCode,
        status: u.status,
        productId: u.productId,
        productName: u.product.name,
        category: u.product.category,
        purchaseDate: u.purchaseDate.toISOString()
    }))

    const productAssets = products.map(p => {
        const total = p._count.productUnits
        const rented = p.productUnits.filter(u => u.status === 'IN_USE').length
        const broken = p.productUnits.filter(u => u.status === 'DAMAGED').length
        // Logic: Available = Total - Rented - Broken
        const available = total - rented - broken

        return {
            id: p.id,
            name: p.name,
            category: p.category,
            total,
            available,
            rented,
            broken,
            status: total > 0 ? (available > 0 ? 'HEALTHY' : 'OUT_OF_STOCK') : 'NO_UNITS'
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight uppercase">Inventory & Assets</h2>
                <p className="text-muted-foreground italic font-medium">Real-time tracking of hardware units and stock status</p>
            </div>
            <InventoryClient
                initialUnits={formattedUnits}
                productAssets={productAssets}
                products={products.map(p => ({ id: p.id, name: p.name }))}
            />
        </div>
    )
}
