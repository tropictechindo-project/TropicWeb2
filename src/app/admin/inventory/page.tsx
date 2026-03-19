import { db } from "@/lib/db"
import { InventoryClient } from "@/components/admin/inventory/InventoryClient"

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
    const products = await db.product.findMany({
        include: {
            variants: {
                include: {
                    units: true
                }
            }
        },
        orderBy: { name: 'asc' }
    })

    const productAssets = products.map(p => {
        const allUnits = p.variants.flatMap(v => v.units)
        
        return {
            id: p.id,
            productId: p.id,
            name: p.name,
            category: p.category,
            total: allUnits.length,
            available: allUnits.filter(u => u.status === 'AVAILABLE').length,
            reserved: allUnits.filter(u => u.status === 'RESERVED').length,
            rented: allUnits.filter(u => u.status === 'RENTED').length,
            maintenance: allUnits.filter(u => u.status === 'MAINTENANCE').length,
            lost: allUnits.filter(u => u.status === 'LOST').length,
            status: (allUnits.filter(u => u.status === 'AVAILABLE').length > 0) ? 'HEALTHY' : 'OUT_OF_STOCK'
        }
    })

    const inventoryUnits = await (db as any).inventoryUnit.findMany({
        orderBy: { serialCode: 'asc' },
        include: { product: { select: { name: true } } }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight uppercase">Inventory & Assets</h2>
                <p className="text-muted-foreground italic font-medium">Real-time tracking of product variant stock</p>
            </div>
            <InventoryClient
                productAssets={productAssets}
                products={products.map(p => ({ id: p.id, name: p.name }))}
                inventoryUnits={inventoryUnits || []}
            />
        </div>
    )
}
