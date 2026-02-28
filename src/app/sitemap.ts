import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://tropictech.online'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/auth/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/checkout`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]

    try {
        // Dynamic Product pages
        const products = await db.product.findMany({ select: { id: true, createdAt: true } })
        const productPages: MetadataRoute.Sitemap = products.map((p) => ({
            url: `${baseUrl}/product/${p.id}`,
            lastModified: p.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }))

        // Dynamic Package pages (assuming they have routes)
        const packages = await db.rentalPackage.findMany({ select: { id: true, createdAt: true } })
        const packagePages: MetadataRoute.Sitemap = packages.map((pkg) => ({
            url: `${baseUrl}/product/${pkg.id}`, // Packages usually display in product detail or modal
            lastModified: pkg.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }))

        return [...staticPages, ...productPages, ...packagePages]
    } catch (err) {
        console.error('Sitemap error:', err)
        return staticPages
    }
}
