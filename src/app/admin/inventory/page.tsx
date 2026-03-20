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
        const defaultVariant = p.variants[0]
        
        return {
            id: p.id,
            productId: p.id,
            name: p.name,
            category: p.category,
            defaultVariantId: defaultVariant?.id,
            total: allUnits.length,
            available: allUnits.filter(u => u.status === 'AVAILABLE').length,
            reserved: allUnits.filter(u => u.status === 'RESERVED').length,
            rented: allUnits.filter(u => u.status === 'RENTED').length,
            maintenance: allUnits.filter(u => u.status === 'MAINTENANCE').length,
            lost: allUnits.filter(u => u.status === 'LOST').length,
            status: (allUnits.filter(u => u.status === 'AVAILABLE').length > 0) ? 'HEALTHY' : 'OUT_OF_STOCK'
        }
    })

    const productUnits = await db.productUnit.findMany({
        orderBy: { assetTag: 'asc' },
        include: { 
            variant: { 
                include: { 
                    product: { select: { name: true } } 
                } 
            } 
        }
    })

    const formattedUnits = productUnits.map(u => ({
        ...u,
        purchasePrice: u.purchasePrice ? Number(u.purchasePrice) : 0,
        installmentMonthly: u.installmentMonthly ? Number(u.installmentMonthly) : 0,
        installmentPaidAmount: u.installmentPaidAmount ? Number(u.installmentPaidAmount) : 0,
        installmentRemaining: u.installmentRemaining ? Number(u.installmentRemaining) : 0,
        revenue: u.revenue ? Number(u.revenue) : 0,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        purchaseDate: u.purchaseDate?.toISOString() || null,
        lastServiceDate: u.lastServiceDate?.toISOString() || null,
        variant: {
            ...u.variant,
            monthlyPrice: u.variant.monthlyPrice ? Number(u.variant.monthlyPrice) : 0,
            createdAt: u.variant.createdAt.toISOString(),
            updatedAt: u.variant.updatedAt.toISOString(),
            product: {
                ...u.variant.product
            }
        }
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black tracking-tight uppercase">Inventory & Assets</h2>
                <p className="text-muted-foreground italic font-medium">Real-time tracking of product asset units & ROI</p>
            </div>
            <InventoryClient
                productAssets={productAssets}
                products={products.map(p => ({ id: p.id, name: p.name }))}
                inventoryUnits={formattedUnits || []}
            />
        </div>
    )
}
