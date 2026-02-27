import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { PackagesClient } from "@/components/admin/packages/PackagesClient"

export default async function AdminPackagesPage() {
    const [packages, products] = await Promise.all([
        db.rentalPackage.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                rentalPackageItems: {
                    include: {
                        product: true
                    }
                }
            }
        }),
        db.product.findMany({
            select: { id: true, name: true, monthlyPrice: true }
        })
    ])

    const formattedPackages = packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: Number(pkg.price),
        duration: pkg.duration,
        imageUrl: pkg.imageUrl,
        createdAt: pkg.createdAt?.toISOString() || null,
        discountPercentage: pkg.discountPercentage || 0,
        items: pkg.rentalPackageItems.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            quantity: item.quantity || 0
        }))
    }))

    const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.monthlyPrice)
    }))
    return (
        <div className="space-y-6" >
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Packages</h2>
            </div>
            <PackagesClient initialPackages={formattedPackages} availableProducts={formattedProducts} />
        </div >
    )
}
