import { Metadata } from 'next'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import Products from '@/components/landing/Products'
import { db } from '@/lib/db'

interface SEOPageProps {
    params: { slug: string }
}

export async function generateMetadata({ params }: SEOPageProps): Promise<Metadata> {
    const { slug } = params
    if (!slug) return { title: 'Bali Office Equipment Rental' }

    const titleMap: Record<string, string> = {
        'monitor-rental-bali': 'Monitor Rental Bali | 4K & Ultrawide Screens for Rent',
        'office-desk-rental-bali': 'Office Desk Rental Bali | Ergonomic & Standing Desks',
        'workstation-rental-bali': 'Workstation Rental Bali | Complete Remote Work Setup',
        'office-setup-bali': 'Office Setup Bali | Premium Equipment for Teams & Individual',
        'digital-nomad-office-bali': 'Digital Nomad Office Bali | Work Anywhere with Tropic Tech',
    }

    const title = titleMap[slug] || 'Bali Office Equipment Rental | Tropic Tech'

    return {
        title,
        description: `Rent premium ${slug.replace(/-/g, ' ')} in Bali. Fast 24-hour delivery to Canggu, Ubud, and Seminyak. Enterprise-grade equipment for digital nomads and startup teams.`,
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
    const { slug } = params
    if (!slug) return null

    const products = await getProducts()
    const serializedProducts = JSON.parse(JSON.stringify(products))

    const h1Map: Record<string, string> = {
        'monitor-rental-bali': 'Premium Monitor Rental in Bali',
        'office-desk-rental-bali': 'Ergonomic Office Desk Rental Bali',
        'workstation-rental-bali': 'Full Workstation Rental Bali',
        'office-setup-bali': 'Professional Office Setup Bali',
        'digital-nomad-office-bali': 'Ultimate Digital Nomad Office Bali',
    }

    const h1 = h1Map[slug] || 'Bali Office Rental'

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
                            Tropic Tech provides the highest quality {slug.replace(/-/g, ' ')} solutions on the island.
                            Whether you are a solo nomad in Canggu or a startup team in Ubud, we deliver
                            enterprise-ready infrastructure to your door within 24 hours.
                        </p>
                    </div>

                    <Products initialProducts={serializedProducts} />

                    <div className="mt-24 prose prose-slate max-w-none">
                        <h2 className="text-3xl font-bold mb-8">Why Choose Our {params.slug.replace(/-/g, ' ')}?</h2>
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
    return [
        { slug: 'monitor-rental-bali' },
        { slug: 'office-desk-rental-bali' },
        { slug: 'workstation-rental-bali' },
        { slug: 'office-setup-bali' },
        { slug: 'digital-nomad-office-bali' },
    ]
}
