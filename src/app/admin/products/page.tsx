import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { ProductsClient } from "@/components/admin/products/ProductsClient"

export default async function AdminProductsPage() {
    const products = await db.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            variants: true,
            _count: {
                select: {
                    rentalPackageItems: true
                }
            }
        }
    })

    const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        monthlyPrice: Number(p.monthlyPrice),
        stock: p.variants.reduce((acc, v) => acc + (v.stockQuantity - v.reservedQuantity), 0),
        imageUrl: p.imageUrl,
        images: p.images,
        specs: p.specs,
        createdAt: p.createdAt?.toISOString(),
        _count: p._count,
        price: Number(p.monthlyPrice),
        isDeletable: p._count.rentalPackageItems === 0
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            </div>
            <ProductsClient initialProducts={formattedProducts} />
        </div>
    )
}
