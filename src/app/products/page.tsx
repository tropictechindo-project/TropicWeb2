import { Metadata } from 'next'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { db } from '@/lib/db'
import { ProductsClientView } from './ProductsClientView'

export const revalidate = 60

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

    const REAL_VIEW_IMAGES = [
        '/Real-View-WebP/031f79baecbc42cf694bd9cd1d708411.webp',
        '/Real-View-WebP/04e4e2fa4c95f23017e79dc9be6007c4.webp',
        '/Real-View-WebP/0c6ba37f-0da2-4bb4-ba1f-39041ce23792.webp',
        '/Real-View-WebP/13e319869efd79d6115fc5687b213768.webp',
        '/Real-View-WebP/33aabf501484a286fe88624468fc4e50.webp',
        '/Real-View-WebP/58b745ef6fe2edd412edcc61f37ccdf3.webp',
        '/Real-View-WebP/59c00e92adaabfd1d301d1fa1ee0c933.webp',
        '/Real-View-WebP/6e111249bbfbd341a3ad30ab1fe0a5be.webp',
        '/Real-View-WebP/7bcdde95f664d6234d2dcb09151c4faa.webp',
        '/Real-View-WebP/7cc074cb90651f3321d1477d0d83051f.webp',
    ]

    const categories = Array.from(new Set(products.map(p => p.category)))

    // Transform raw server models into a unified front-end structure focused on "Total Price" vs granular daily/monthly.
    const mappedProducts = products.map((p, i) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        imageUrl: REAL_VIEW_IMAGES[i % REAL_VIEW_IMAGES.length],
        price: Number(p.monthlyPrice), // Fallback map 'Total Price' to monthly
        discountPercentage: p.discountPercentage || 0,
        category: p.category,
        type: 'PRODUCT' as const
    }))

    const mappedPackages = packages.map((pkg, i) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        imageUrl: REAL_VIEW_IMAGES[(i + products.length) % REAL_VIEW_IMAGES.length],
        price: Number(pkg.price),
        discountPercentage: pkg.discountPercentage || 0,
        category: 'Bundle / Package',
        type: 'PACKAGE' as const
    }))

    const mappedOffers = specialOffers.map((offer, i) => ({
        id: offer.id,
        name: offer.title,
        description: offer.description || '',
        imageUrl: REAL_VIEW_IMAGES[(i + products.length + packages.length) % REAL_VIEW_IMAGES.length],
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
