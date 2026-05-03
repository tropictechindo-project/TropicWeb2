import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { SEO_PAGES } from '@/lib/seo-pages-data'
import { db } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 3600 // Cache for 1 hour

async function getProducts() {
    try {
        const products = await db.product.findMany({
            select: { id: true, name: true, category: true }
        })
        return products
    } catch {
        return []
    }
}

export default async function SitemapPage() {
    const products = await getProducts()

    const regionalHubsSlugs = [
        'rent-workstation-ubud', 'rent-monitor-canggu', 'office-setup-seminyak',
        'startup-rental-uluwatu', 'digital-nomad-sanur-workspace', 'it-hardware-denpasar',
        'workspace-rental-kuta', 'remote-work-infrastructure-jimbaran'
    ]

    const baliMasterclassSlugs = [
        'ultimate-guide-bali-internet-vpn-2026', 'science-of-tropical-ergonomics-bali',
        'complete-guide-remote-work-bali-2026', 'setting-up-productive-home-office-tropics',
        'hardware-requirements-software-developers-bali', 'understanding-it-infrastructure-indonesia',
        'cyber-security-tips-traveling-professionals'
    ]

    const productClusterSlugs = [
        'rent-desk-bali', 'rent-chair-bali', 'rent-monitor-bali', 'rent-workstation-bali',
        'rent-setup-workstation-in-bali', 'rent-high-performance-laptop-bali',
        'corporate-it-equipment-rental-indonesia', 'remote-work-equipment-solutions-expats',
        'gaming-pc-rentals-streamers-bali', 'startup-incubation-office-equipment-packages',
        'event-conference-tech-rentals-indonesia', 'student-laptop-rental-discounts-plans',
        'renting-it-equipment-vs-buying-2026'
    ]

    const baliRentClusterSlugs = [
        'rent-monitor-bali',
        'rent-deks-bali',
        'rent-chair-bali',
        'rent-stuff-bali',
        'rent-setup-work-bali',
        'bali-monitor',
        'rent-grear-for-work-bali',
        'fast-delivery-rent-bali',
        'scam-rent-company-in-bali',
        'is-rent-desk-monitor-in-bali-a-scam',
        'can-travelers-rent-work-equipment-bali',
        'rent-workstation-bali-2026-2027',
    ]

    const categories = {
        'Company & Support': [
            { title: 'Home', href: '/' },
            { title: 'About Us', href: '/about' },
            { title: 'Company Profile (Legal)', href: '/company-profile' },
            { title: 'Help Center & Guides', href: '/help' },
            { title: 'Services', href: '/services' },
            { title: 'FAQ', href: '/faq' },
            { title: 'Contact', href: '/contact' },
        ],
        'Regional Hubs': regionalHubsSlugs.map(slug => ({
            title: SEO_PAGES[slug]?.h1?.split(' | ')[0] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            href: `/${slug}`
        })),
        'Bali Masterclass': baliMasterclassSlugs.map(slug => ({
            title: SEO_PAGES[slug]?.h1 || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            href: `/${slug}`
        })),
        'Product Clusters': productClusterSlugs.map(slug => ({
            title: SEO_PAGES[slug]?.h1?.split(' | ')[0] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            href: `/${slug}`
        })),
        'Our Catalog': products.map(p => ({
            title: p.name,
            href: `/product/${p.id}`
        })),
        '🏝️ Bali Rent Cluster': baliRentClusterSlugs.map(slug => ({
            title: SEO_PAGES[slug]?.h1?.split(' —')[0].split(' |')[0] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            href: `/${slug}`
        }))
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-24 bg-muted/10">
                <div className="container mx-auto px-4 py-12">
                     <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center">Website Sitemap</h1>
                     <p className="text-muted-foreground text-center mb-12">Navigate quickly through our corporate rentals, remote work solutions, and guides in Bali.</p>

                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {Object.entries(categories).map(([category, links], i) => (
                               <div key={i} className="bg-card border rounded-3xl p-8 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                                    <div className="flex items-center gap-3 mb-6">
                                         <div className="w-1.5 h-6 bg-primary rounded-full group-hover:h-8 transition-all" />
                                         <h2 className="font-black text-xl uppercase tracking-tighter text-foreground">{category}</h2>
                                    </div>
                                    <ul className="space-y-3">
                                         {links.map((link, li) => (
                                              <li key={li}>
                                                   <Link href={link.href} className="group/link flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1">
                                                        <span className="h-1 w-1 rounded-full bg-muted-foreground group-hover/link:bg-primary group-hover/link:scale-150 transition-all" />
                                                        <span className="font-medium">{link.title}</span>
                                                   </Link>
                                              </li>
                                         ))}
                                    </ul>
                               </div>
                          ))}
                     </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
