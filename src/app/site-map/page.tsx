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

    const categories = {
        Company: [
            { title: 'Home', href: '/' },
            { title: 'About Us', href: '/about' },
            { title: 'Services', href: '/services' },
            { title: 'FAQ', href: '/faq' },
            { title: 'Contact', href: '/contact' },
        ],
        Solutions: Object.keys(SEO_PAGES).map(slug => ({
            title: SEO_PAGES[slug].h1,
            href: `/${slug}`
        })),
        Products: products.map(p => ({
            title: p.name,
            href: `/product/${p.id}`
        }))
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-24 bg-muted/10">
                <div className="container mx-auto px-4 py-12">
                     <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center">Website Sitemap</h1>
                     <p className="text-muted-foreground text-center mb-12">Navigate quickly through our corporate rentals, remote work solutions, and guides in Bali.</p>

                     <div className="grid md:grid-cols-3 gap-8">
                          {Object.entries(categories).map(([category, links], i) => (
                               <div key={i} className="bg-card border rounded-2xl p-6 shadow-sm">
                                    <h2 className="font-black text-lg uppercase tracking-wider mb-4 text-primary border-b pb-2">{category}</h2>
                                    <ul className="space-y-2">
                                         {links.map((link, li) => (
                                              <li key={li}>
                                                   <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors block py-1">
                                                        {link.title}
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
