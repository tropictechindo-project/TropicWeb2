import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SEO_PAGES } from '@/lib/seo-pages-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://tropictech.online'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/affiliate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
        { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
        { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/checkout`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/sitemap`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }
    ]

    const oldSeoSlugs = [
        'rent-monitor-bali', 'rent-desk-bali', 'rent-workstation-bali', 'rent-office-bali',
        'rent-chair-bali', 'remote-work-setup-bali', 'digital-nomad-workspace-bali',
        'startup-office-setup-bali', 'event-workstation-rental-bali', 'temporary-office-bali'
    ]

    const seoPages: MetadataRoute.Sitemap = [
        ...oldSeoSlugs,
        ...Object.keys(SEO_PAGES)
    ].map(slug => ({
        url: `${baseUrl}/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85
    }))

    try {
        const products = await db.product.findMany({ select: { id: true, createdAt: true } })
        const productPages: MetadataRoute.Sitemap = products.map((p: any) => ({
            url: `${baseUrl}/product/${p.id}`,
            lastModified: p.createdAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }))

        return [...staticPages, ...seoPages, ...productPages]
    } catch (err) {
        console.error('Sitemap error:', err)
        return [...staticPages, ...seoPages]
    }
}
