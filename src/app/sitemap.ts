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
            url: `${baseUrl}/services`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/affiliate`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
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
        const products = await db.product.findMany({
            select: { id: true, createdAt: true },
            where: { status: 'PUBLISHED' } // Only show published products
        })

        const productPages: MetadataRoute.Sitemap = products.map((p) => ({
            url: `${baseUrl}/product/${p.id}`,
            lastModified: p.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }))

        return [...staticPages, ...productPages]
    } catch (err) {
        console.error('Sitemap error:', err)
        return staticPages
    }
}
