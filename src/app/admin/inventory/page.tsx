import { db } from "@/lib/db"
import { InventoryClient } from "@/components/admin/inventory/InventoryClient"

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
    const products = await db.product.findMany({
        include: {
            variants: true
        },
        orderBy: { name: 'asc' }
    })

    const productAssets = products.flatMap(p =>
        p.variants.map(v => ({
            id: v.id,
            productId: p.id,
            name: `${p.name} (${v.color})`,
            category: p.category,
            total: v.stockQuantity,
            available: v.stockQuantity - v.reservedQuantity,
            rented: v.reservedQuantity,
            broken: 0, // Deprecated in variant model
            status: (v.stockQuantity - v.reservedQuantity > 0) ? 'HEALTHY' : 'OUT_OF_STOCK'
        }))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight uppercase">Inventory & Assets</h2>
                <p className="text-muted-foreground italic font-medium">Real-time tracking of product variant stock</p>
            </div>
            <InventoryClient
                productAssets={productAssets}
                products={products.map(p => ({ id: p.id, name: p.name }))}
            />
        </div>
    )
}
