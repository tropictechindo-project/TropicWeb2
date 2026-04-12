import { Metadata } from 'next'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import Products from '@/components/landing/Products'
import { db } from '@/lib/db'
import { SEO_PAGES, SEOSection } from '@/lib/seo-pages-data'
import Link from 'next/link'

const BASE_URL = 'https://tropictech.rent'
const OG_IMAGE = '/images/og-image.webp'

interface SEOPageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SEOPageProps): Promise<Metadata> {
    const { slug } = await params
    if (!slug) return { title: 'Bali Office Equipment Rental' }

    // 1. Try to fetch from Database
    const dbPage = await db.seoPage.findUnique({
        where: { slug, status: 'PUBLISHED' }
    })

    // 2. Fallback to Static Registry
    const staticConfig = SEO_PAGES[slug]

    let title = `${slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} | Tropic Tech Bali`
    let description = `Rent premium ${slug.replace(/-/g, ' ')} in Bali. Fast 24-hour delivery to Canggu, Ubud, and Seminyak. Enterprise-grade equipment for digital nomads and startup teams.`

    if (dbPage) {
        title = dbPage.title
        description = dbPage.description || description
    } else if (staticConfig) {
        title = staticConfig.title || title
        description = staticConfig.description || description
    }

    const canonicalUrl = `${BASE_URL}/${slug}`

    return {
        title,
        description,
        robots: { index: true, follow: true },
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            type: 'article',
            url: canonicalUrl,
            siteName: 'Tropic Tech Bali',
            locale: 'en_US',
            images: [{
                url: `${BASE_URL}${OG_IMAGE}`,
                width: 1200,
                height: 630,
                alt: title
            }]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${BASE_URL}${OG_IMAGE}`]
        },
        other: {
            'geo.region': 'ID-BA',
            'geo.placename': 'Bali, Indonesia',
            'geo.position': '-8.6539;115.1469',
            'ICBM': '-8.6539, 115.1469',
        }
    }
}

async function getProducts() {
    try {
        const products = await db.product.findMany({
            orderBy: { monthlyPrice: 'asc' },
            include: { variants: { include: { units: true } } }
        })
        const categoryOrder: Record<string, number> = { 'Desk': 1, 'Monitor': 2, 'Chair': 3 }
        return products
            .sort((a, b) => {
                const oa = categoryOrder[a.category] ?? 4
                const ob = categoryOrder[b.category] ?? 4
                return oa !== ob ? oa - ob : Number(a.monthlyPrice) - Number(b.monthlyPrice)
            })
            .map(p => ({
                ...p,
                stock: Math.max(0, p.variants.reduce((t, v) => t + v.units.filter(u => u.status === 'AVAILABLE').length, 0)),
                monthlyPrice: Number(p.monthlyPrice),
            }))
    } catch { return [] }
}

// ─── Section Renderers ────────────────────────────────────────────────────────

function StatsSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-10 uppercase tracking-tight">{section.heading}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {section.items.map((item, i) => (
                    <div key={i} className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-3xl md:text-4xl font-black text-primary mb-1">{item.value}</div>
                        <div className="font-bold text-sm uppercase tracking-wider mb-1">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}

function StepsSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4 bg-muted/20">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-tight">{section.heading}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.items.map((item, i) => (
                        <div key={i} className="relative bg-card border border-border rounded-3xl p-6 shadow-sm">
                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-white font-black text-sm flex items-center justify-center shadow-lg">
                                {i + 1}
                            </div>
                            <h3 className="font-black text-base mb-2 mt-1">{item.label}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function AreasSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-tight">{section.heading}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.items.map((item, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                                <span className="font-black text-sm">{item.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-4">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function BenefitsSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4 bg-muted/20">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-tight">{section.heading}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {section.items.map((item, i) => (
                        <div key={i} className="flex gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 font-black text-base">
                                ✓
                            </div>
                            <div>
                                <h3 className="font-black text-base mb-1">{item.label}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function TrustSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-tight">{section.heading}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.items.map((item, i) => (
                        <div key={i} className="bg-primary/5 border border-primary/10 rounded-3xl p-6 text-center hover:bg-primary/10 transition-colors">
                            <div className="w-12 h-12 bg-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                <span className="text-primary font-black text-xl">★</span>
                            </div>
                            <h3 className="font-black text-sm mb-2">{item.label}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function GenericSection({ section }: { section: SEOSection }) {
    return (
        <section className="py-16 px-4 bg-muted/20">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-10 text-center uppercase tracking-tight">{section.heading}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((item, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            {item.value && <div className="text-2xl font-black text-primary mb-1">{item.value}</div>}
                            <h3 className="font-bold text-sm mb-2">{item.label}</h3>
                            {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function renderSection(section: SEOSection, index: number) {
    switch (section.type) {
        case 'stats': return <StatsSection key={index} section={section} />
        case 'steps': return <StepsSection key={index} section={section} />
        case 'areas': return <AreasSection key={index} section={section} />
        case 'benefits': return <BenefitsSection key={index} section={section} />
        case 'trust': return <TrustSection key={index} section={section} />
        default: return <GenericSection key={index} section={section} />
    }
}

// ─── JSON-LD builder ──────────────────────────────────────────────────────────

function buildJsonLd(slug: string, title: string, description: string) {
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    const returnPolicy = {
        '@type': 'MerchantReturnPolicy',
        'applicableCountry': 'ID',
        'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
        'merchantReturnDays': 1,
        'returnMethod': 'https://schema.org/ReturnByMail',
        'returnFees': 'https://schema.org/FreeReturn'
    }
    const shippingDetails = {
        '@type': 'OfferShippingDetails',
        'shippingRate': { '@type': 'MonetaryAmount', 'value': '0', 'currency': 'IDR' },
        'shippingDestination': {
            '@type': 'DefinedRegion',
            'addressCountry': 'ID',
            'addressRegion': 'BA'
        },
        'deliveryTime': {
            '@type': 'ShippingDeliveryTime',
            'handlingTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY' },
            'transitTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY' }
        }
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': title,
        'description': description,
        'brand': { '@type': 'Brand', 'name': 'Tropic Tech Bali' },
        'url': `${BASE_URL}/${slug}`,
        'image': `${BASE_URL}${OG_IMAGE}`,
        'offers': {
            '@type': 'Offer',
            'name': title,
            'description': description,
            'priceCurrency': 'IDR',
            'price': '100000',
            'priceValidUntil': nextYear,
            'availability': 'https://schema.org/InStock',
            'itemCondition': 'https://schema.org/NewCondition',
            'seller': {
                '@type': 'Organization',
                'name': 'Tropic Tech Bali',
                'url': BASE_URL,
                'address': {
                    '@type': 'PostalAddress',
                    'addressLocality': 'Badung',
                    'addressRegion': 'Bali',
                    'addressCountry': 'ID'
                }
            },
            'hasMerchantReturnPolicy': returnPolicy,
            'shippingDetails': shippingDetails
        },
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '5.0',
            'reviewCount': '124'
        }
    }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SEOLandingPage({ params }: SEOPageProps) {
    const { slug } = await params
    if (!slug) return null

    // 1. Try to fetch from Database (NEW)
    const dbPage = await db.seoPage.findUnique({
        where: { slug, status: 'PUBLISHED' }
    })

    // 4. Log Analytics View (Fire and Forget)
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        await db.seoAnalytics.upsert({
            where: { slug_date: { slug, date: today } },
            update: { views: { increment: 1 } },
            create: { slug, date: today, views: 1, pageId: dbPage?.id }
        })
    } catch (e) {
        console.error('Analytics log failed:', e)
    }

    // 2. Fallback to Static Registry (OLD)
    const staticConfig = SEO_PAGES[slug]

    // 3. Resolve configuration
    let config: any = null
    if (dbPage) {
        config = {
            title: dbPage.title,
            description: dbPage.description,
            h1: dbPage.h1,
            heroSub: dbPage.heroSub,
            ...(dbPage.content as any)
        }
    } else if (staticConfig) {
        config = staticConfig
    }

    if (!config) return null

    const products = await getProducts()
    const serializedProducts = JSON.parse(JSON.stringify(products))

    const h1 = config.h1 || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const heroSub = config.heroSub || `Tropic Tech provides the highest quality ${slug.replace(/-/g, ' ')} solutions in Bali. Fast delivery. Premium gear. Zero hassle.`
    const title = config.title || `${h1} | Tropic Tech Bali`
    const description = config.description || heroSub

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(slug, title, description)) }}
            />

            {/* FAQ JSON-LD */}
            {config?.faqs && config.faqs.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'FAQPage',
                            'mainEntity': config.faqs.map(faq => ({
                                '@type': 'Question',
                                'name': faq.q,
                                'acceptedAnswer': { '@type': 'Answer', 'text': faq.a }
                            }))
                        })
                    }}
                />
            )}

            <main className="flex-1 pt-24">

                {/* ── Hero ── */}
                <section className="bg-gray-900 text-white py-20 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-gray-900 to-black" />
                    <div className="max-w-5xl mx-auto relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Bali-Based · Fast Delivery · Island-Wide
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 uppercase leading-none">
                            {h1}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
                            {heroSub}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/products" className="bg-white text-gray-900 font-black px-6 py-3 rounded-full text-sm uppercase tracking-wider hover:bg-gray-100 transition shadow-xl">
                                Browse Catalog
                            </Link>
                            <Link href="/contact" className="border border-white/40 text-white font-bold px-6 py-3 rounded-full text-sm uppercase tracking-wider hover:bg-white/10 transition">
                                Get a Quote →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Trust Bar ── */}
                <section className="border-b border-border bg-muted/30 py-4 px-4">
                    <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Same-Day Delivery Bali</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 5.0★ Rated (124+ Reviews)</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> PT Tropic Tech International</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> NIB Registered Company</span>
                        <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 24h Swap Guarantee</span>
                    </div>
                </section>

                {/* ── Features & FAQ ── */}
                {config && (
                    <section className="py-16 px-4">
                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                <h2 className="font-black text-xl mb-6 uppercase tracking-tight">Why Choose This Service</h2>
                                <ul className="space-y-4">
                                    {config.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 font-black text-xs">✓</span>
                                            <div>
                                                <span className="font-bold">{f.title}: </span>
                                                <span className="text-muted-foreground">{f.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                                <h2 className="font-black text-xl mb-6 uppercase tracking-tight">Frequently Asked</h2>
                                <div className="space-y-3">
                                    {config.faqs.map((faq, i) => (
                                        <details key={i} className="group border border-border rounded-2xl p-4 bg-muted/20 cursor-pointer">
                                            <summary className="font-bold text-sm list-none flex justify-between items-center gap-2">
                                                <span>{faq.q}</span>
                                                <span className="text-primary shrink-0 group-open:rotate-180 transition-transform">↓</span>
                                            </summary>
                                            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">{faq.a}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Products Section ── */}
                <section className="py-4 px-4 bg-muted/10">
                    <div className="max-w-5xl mx-auto mb-8">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Our Rental Catalog</h2>
                        <p className="text-muted-foreground mt-2">Browse all available equipment — delivered to your Bali villa.</p>
                    </div>
                    <Products initialProducts={serializedProducts} />
                </section>

                {/* ── Dynamic Rich Sections from config ── */}
                {config?.sections && config.sections.map((section, i) => renderSection(section, i))}

                {/* ── Comparison Table ── */}
                {config?.comparison && (
                    <section className="py-16 px-4 bg-muted/20">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-black mb-10 uppercase tracking-tight text-center">Value Comparison</h2>
                            <div className="overflow-x-auto rounded-3xl border border-border shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-primary/5 border-b border-border">
                                            {config.comparison.headers.map((h, i) => (
                                                <th key={i} className={`p-4 text-left font-black uppercase tracking-wider text-xs ${i === config.comparison.headers.length - 1 ? 'text-primary' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {config.comparison.rows.map((row, ri) => (
                                            <tr key={ri} className="hover:bg-muted/10 transition-colors">
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className={`p-4 ${ci === 0 ? 'font-bold text-foreground' : 'text-muted-foreground'} ${ci === row.length - 1 ? 'text-primary font-semibold' : ''}`}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Why Tropic Tech Static Section ── */}
                <section className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-black mb-10 uppercase tracking-tight text-center">Why Tropic Tech?</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: '🚀', title: 'Island-Wide Delivery', desc: 'We deliver to Canggu, Seminyak, Kuta, Ubud, Sanur, Jimbaran, and all of Bali within 24 hours.' },
                                { icon: '💎', title: 'Enterprise-Grade Equipment', desc: 'Only premium, professionally maintained hardware. Every item tested before delivery.' },
                                { icon: '🔄', title: 'Flexible Rental Terms', desc: 'Rent daily, weekly, or monthly. No long-term contracts. Scale up or down anytime.' },
                                { icon: '🛠️', title: 'Full Setup Service', desc: 'We don\'t just deliver — we install, configure, and cable-manage your entire workspace.' },
                                { icon: '📱', title: 'WhatsApp Support', desc: 'Direct line to our operations team via WhatsApp — fast response, real humans.' },
                                { icon: '🏛️', title: 'Legal, Registered Company', desc: 'PT Tropic Tech International, NIB No. 1712240076832. Full invoices, receipts, and legal contracts.' }
                            ].map((item, i) => (
                                <div key={i} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                                    <span className="text-3xl mb-4 block">{item.icon}</span>
                                    <h3 className="font-black text-base mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Banner ── */}
                <section className="bg-gray-900 text-white py-16 px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tight">Ready to Set Up in Bali?</h2>
                    <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Browse our full catalog and place your order. We\'ll handle everything — from delivery to installation.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/products" className="bg-white text-gray-900 font-black px-8 py-4 rounded-full uppercase tracking-wider hover:bg-gray-100 transition shadow-xl">
                            Browse Full Catalog
                        </Link>
                        <Link href="/contact" className="border border-white/40 text-white font-bold px-8 py-4 rounded-full uppercase tracking-wider hover:bg-white/10 transition">
                            Contact Us
                        </Link>
                    </div>
                    <p className="mt-6 text-xs text-gray-500">PT Tropic Tech International · Bali, Indonesia · contact@tropictech.online</p>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export async function generateStaticParams() {
    const existingSlugs = [
        'rent-monitor-bali', 'rent-desk-bali', 'rent-workstation-bali', 'rent-office-bali',
        'rent-chair-bali', 'remote-work-setup-bali', 'digital-nomad-workspace-bali',
        'startup-office-setup-bali', 'event-workstation-rental-bali', 'temporary-office-bali',
    ]
    // New Bali Rent Cluster (v4.1)
    const newSlugs = [
        'rent-deks-bali', 'rent-stuff-bali', 'rent-setup-work-bali',
        'bali-monitor', 'rent-grear-for-work-bali', 'fast-delivery-rent-bali',
    ]
    const seoPageSlugs = Object.keys(SEO_PAGES)

    const allSlugs = [...new Set([...existingSlugs, ...newSlugs, ...seoPageSlugs])]
    return allSlugs.map(slug => ({ slug }))
}
