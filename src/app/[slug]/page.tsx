import { Metadata } from 'next'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import Products from '@/components/landing/Products'
import { db } from '@/lib/db'
import { SEO_PAGES } from '@/lib/seo-pages-data'

interface SEOPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SEOPageProps): Promise<Metadata> {
    const { slug } = await params
    if (!slug) return { title: 'Bali Office Equipment Rental' }

    const config = SEO_PAGES[slug]
    if (config) {
        return {
            title: config.title,
            description: config.description,
            openGraph: {
                title: config.title,
                description: config.description,
                type: 'article',
                url: `https://tropictech.rent/${slug}`,
                images: [{ url: '/images/og-image.webp', width: 1200, height: 630, alt: config.title }]
            },
            twitter: {
                card: 'summary_large_image',
                title: config.title,
                description: config.description,
                images: ['/images/og-image.webp']
            }
        }
    }

    const titleMap: Record<string, string> = {
        'rent-monitor-bali': 'Monitor Rental Bali | 4K & Ultrawide Screens for Rent',
        'rent-desk-bali': 'Office Desk Rental Bali | Ergonomic & Standing Desks',
        'rent-workstation-bali': 'Workstation Rental Bali | Complete Remote Work Setup',
        'rent-office-bali': 'Office Rental Bali | Complete Workspace Setup',
        'rent-chair-bali': 'Ergonomic Chair Rental Bali | Premium Seating',
        'remote-work-setup-bali': 'Remote Work Setup Bali | Complete Office Workspace',
        'digital-nomad-workspace-bali': 'Digital Nomad Workspace Bali | Premium Setup',
        'startup-office-setup-bali': 'Startup Office Setup Bali | Team Workspace Rental',
        'event-workstation-rental-bali': 'Event Workstation Rental Bali | High-Performance Setup',
        'temporary-office-bali': 'Temporary Office Rental Bali | Flexible Office Space',
    }

    const title = titleMap[slug] || 'Bali Office Equipment Rental | Tropic Tech'
    const desc = `Rent premium ${slug.replace(/-/g, ' ')} in Bali. Fast 24-hour delivery to Canggu, Ubud, and Seminyak. Enterprise-grade equipment for digital nomads and startup teams.`

    return {
        title,
        description: desc,
        openGraph: {
            title,
            description: desc,
            type: 'article',
            url: `https://tropictech.rent/${slug}`,
            images: [{ url: '/images/og-image.webp', width: 1200, height: 630, alt: title }]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: desc,
            images: ['/images/og-image.webp']
        }
    }
}

async function getProducts() {
    const products = await db.product.findMany({
        include: { variants: { include: { units: true } } }
    })
    return products.map(p => ({
        ...p,
        stock: Math.max(0, p.variants.reduce((t, v) => t + v.units.filter(u => u.status === 'AVAILABLE').length, 0)),
        monthlyPrice: Number(p.monthlyPrice),
    }))
}

export default async function SEOLandingPage({ params }: SEOPageProps) {
    const { slug } = await params
    if (!slug) return null

    const config = SEO_PAGES[slug]
    const products = await getProducts()
    const serializedProducts = JSON.parse(JSON.stringify(products))

    const h1Map: Record<string, string> = {
        'rent-monitor-bali': 'Premium Monitor Rental in Bali',
        'rent-desk-bali': 'Ergonomic Office Desk Rental Bali',
        'rent-workstation-bali': 'Full Workstation Rental Bali',
        'rent-office-bali': 'Professional Office Setup Bali',
        'rent-chair-bali': 'Ergonomic Chair Rental Bali',
        'remote-work-setup-bali': 'Complete Remote Work Setup Bali',
        'digital-nomad-workspace-bali': 'Ultimate Digital Nomad Workspace Bali',
        'startup-office-setup-bali': 'Startup Office Setup Bali',
        'event-workstation-rental-bali': 'Event Workstation Rental Bali',
        'temporary-office-bali': 'Temporary Office Rental Bali',
    }

    const h1 = config ? config.h1 : (h1Map[slug] || 'Bali Office Rental')
    const heroSub = config ? config.heroSub : `Tropic Tech provides the highest quality ${slug.replace(/-/g, ' ')} solutions on the island.`

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-24">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-3xl mb-16">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
                            {h1}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {heroSub}
                        </p>
                    </div>

                    {config && (
                        <div className="grid md:grid-cols-2 gap-6 mb-16 bg-muted/20 p-6 rounded-2xl border">
                            <div>
                                <h2 className="font-bold text-xl mb-4">Core Benefits:</h2>
                                <ul className="space-y-3">
                                    {config.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-green-600 font-bold">✓</span>
                                            <div>
                                                <span className="font-semibold">{f.title}: </span>
                                                <span className="text-muted-foreground">{f.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6">
                                <h2 className="font-bold text-xl mb-4">FAQ Insight:</h2>
                                <div className="space-y-3">
                                    {config.faqs.map((faq, i) => (
                                        <details key={i} className="group border rounded-xl p-3 bg-card cursor-pointer">
                                            <summary className="font-semibold text-sm list-none flex justify-between items-center">
                                                {faq.q}
                                                <span className="group-open:rotate-180 transition-transform">↓</span>
                                            </summary>
                                            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{faq.a}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <Products initialProducts={serializedProducts} />

                    {config && config.comparison && (
                        <div className="mt-24 bg-card border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 text-center">Value Comparison Grid</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            {config.comparison.headers.map((h, i) => (
                                                <th key={i} className="p-3 text-left font-bold uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {config.comparison.rows.map((row, ri) => (
                                            <tr key={ri} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className="p-3 text-muted-foreground">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-24 prose prose-slate max-w-none">
                        <h2 className="text-3xl font-bold mb-8">Why Choose Tropic Tech?</h2>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div>
                                <h3 className="font-bold text-lg mb-2">Island-Wide Delivery</h3>
                                <p className="text-sm text-muted-foreground">We deliver to Canggu, Seminyak, Kuta, Ubud, Sanur, and Bukit within 24 hours.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Premium Quality</h3>
                                <p className="text-sm text-muted-foreground">We stock only the best brands like Dell, Herman Miller, and High-Performance equipment.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Flexible Terms</h3>
                                <p className="text-sm text-muted-foreground">Rent daily, weekly, or monthly. Scale your setup as your team or stay grows.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export async function generateStaticParams() {
    const oldSlugs = [
        'rent-monitor-bali',
        'rent-desk-bali',
        'rent-workstation-bali',
        'rent-office-bali',
        'rent-chair-bali',
        'remote-work-setup-bali',
        'digital-nomad-workspace-bali',
        'startup-office-setup-bali',
        'event-workstation-rental-bali',
        'temporary-office-bali',
    ]
    const newSlugs = Object.keys(SEO_PAGES)
    
    return [...oldSlugs, ...newSlugs].map(slug => ({ slug }))
}
