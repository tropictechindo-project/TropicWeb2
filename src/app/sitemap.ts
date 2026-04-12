import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SEO_PAGES } from '@/lib/seo-pages-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://tropictech.rent'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
        { url: `${baseUrl}/company-profile`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/affiliate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
        { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
        { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/checkout`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/sitemap`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }
    ]

    // SEO Page Clusters
    const regionalHubs = [
        'rent-workstation-ubud', 'rent-monitor-canggu', 'office-setup-seminyak',
        'startup-rental-uluwatu', 'digital-nomad-sanur-workspace', 'it-hardware-denpasar',
        'workspace-rental-kuta', 'remote-work-infrastructure-jimbaran'
    ]

    const baliMasterclass = [
        'ultimate-guide-bali-internet-vpn-2026', 'science-of-tropical-ergonomics-bali',
        'complete-guide-remote-work-bali-2026', 'setting-up-productive-home-office-tropics',
        'hardware-requirements-software-developers-bali', 'understanding-it-infrastructure-indonesia',
        'cyber-security-tips-traveling-professionals'
    ]

    const productClusters = [
        'rent-desk-bali', 'rent-chair-bali', 'rent-monitor-bali', 'rent-workstation-bali',
        'rent-setup-workstation-in-bali', 'rent-high-performance-laptop-bali',
        'corporate-it-equipment-rental-indonesia', 'remote-work-equipment-solutions-expats',
        'gaming-pc-rentals-streamers-bali', 'startup-incubation-office-equipment-packages',
        'event-conference-tech-rentals-indonesia', 'student-laptop-rental-discounts-plans',
        'renting-it-equipment-vs-buying-2026'
    ]

    // 🆕 Bali Rent Cluster v4.1 — new fast-rank keyword pages
    const baliRentCluster = [
        'rent-deks-bali',
        'rent-stuff-bali',
        'rent-setup-work-bali',
        'bali-monitor',
        'rent-grear-for-work-bali',
        'fast-delivery-rent-bali',
        'rent-monitor-bali',
        'rent-chair-bali',
    ]

    // Fallback for any newly added keys in SEO_PAGES not explicitly clustered
    const allExpectedSlugs = [...regionalHubs, ...baliMasterclass, ...productClusters, ...baliRentCluster]
    const otherSeoSlugs = Object.keys(SEO_PAGES).filter(s => !allExpectedSlugs.includes(s))

    const seoPages: MetadataRoute.Sitemap = [
        ...allExpectedSlugs,
        ...otherSeoSlugs
    ].map(slug => ({
        url: `${baseUrl}/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: baliRentCluster.includes(slug) ? 0.9 : 0.85
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
