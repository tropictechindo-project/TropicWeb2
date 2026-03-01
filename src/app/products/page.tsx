import { Metadata } from 'next'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { db } from '@/lib/db'
import { ProductsClientView } from './ProductsClientView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Products | PT Tropic Tech International',
    description: 'Explore our full catalog of premium workstations, monitors, ergonomic chairs, and remote-office accessories available for rent in Bali.',
}

export default async function ProductsPage() {
    // Parallel fetching of all categorized hardware & bundles
    const [products, packages, specialOffers, siteSettingsList] = await Promise.all([
        db.product.findMany({
            include: { variants: { include: { units: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        db.rentalPackage.findMany({
            include: { rentalPackageItems: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        db.specialOffer.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        }),
        db.siteSetting.findMany({
            where: {
                section: { in: ['marketing', 'hero'] }
            }
        })
    ])

    // Convert SiteSettings array to dictionary for easy access
    const settings = siteSettingsList.reduce((acc, curr) => {
        acc[curr.key] = curr.value
        return acc
    }, {} as Record<string, any>)

    const categories = Array.from(new Set(products.map(p => p.category)))

    // Transform raw server models into a unified front-end structure focused on "Total Price" vs granular daily/monthly.
    const mappedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        imageUrl: p.imageUrl || '/LogoTropicTech.webp',
        price: Number(p.monthlyPrice), // Fallback map 'Total Price' to monthly
        discountPercentage: p.discountPercentage || 0,
        category: p.category,
        type: 'PRODUCT' as const
    }))

    const mappedPackages = packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        imageUrl: pkg.imageUrl || '/LogoTropicTech.webp',
        price: Number(pkg.price),
        discountPercentage: pkg.discountPercentage || 0,
        category: 'Bundle / Package',
        type: 'PACKAGE' as const
    }))

    const mappedOffers = specialOffers.map(offer => ({
        id: offer.id,
        name: offer.title,
        description: offer.description || '',
        imageUrl: (offer.images && offer.images.length > 0) ? offer.images[0] : '/LogoTropicTech.webp',
        price: Number(offer.finalPrice),
        discountPercentage: offer.discountPercentage || 0,
        category: 'Special Offer',
        type: 'OFFER' as const
    }))

    return (
        <main className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1">
                <ProductsClientView
                    products={mappedProducts}
                    packages={mappedPackages}
                    offers={mappedOffers}
                    categories={categories}
                    catalogUrl={settings['product_catalog_url']}
                    heroSubtitle={settings['hero_subtitle']}
                    heroSubtitle2={settings['hero_subtitle2']}
                />
            </div>
            <Footer />
        </main>
    )
}
