import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/header/Header'
import Hero from '@/components/landing/Hero'
import LandingClient from '@/components/landing/LandingClient'
import { db } from '@/lib/db'

// ─── Critical above-fold: eager ────────────────────────────────────────────
// Header + Hero are imported eagerly (no dynamic()) for best LCP

// ─── Below-fold: lazy with Suspense skeletons ───────────────────────────────
const Products = dynamic(() => import('@/components/landing/Products'), {
  loading: () => <div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const Packages = dynamic(() => import('@/components/landing/Packages'), {
  loading: () => <div className="h-80 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const Services = dynamic(() => import('@/components/landing/Services'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const AboutUs = dynamic(() => import('@/components/landing/AboutUs'), {
  loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const Reviews = dynamic(() => import('@/components/landing/Reviews'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />,
})
const Footer = dynamic(() => import('@/components/landing/Footer'))
const SellerChatBubble = dynamic(() =>
  import('@/components/ai/SellerChatBubble').then(m => ({ default: m.SellerChatBubble }))
)

export const revalidate = 60

// ─── Data fetching ──────────────────────────────────────────────────────────
async function getHeroSettings() {
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: { in: ['hero_title', 'hero_subtitle', 'hero_subtitle2', 'hero_image', 'hero_opacity_default', 'hero_show_slider'] }
      }
    })
    return settings.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc }, {} as any)
  } catch { return {} }
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

async function getPackages() {
  try {
    const packages = await db.rentalPackage.findMany({
      orderBy: { price: 'desc' },
      take: 3,
      include: { rentalPackageItems: { include: { product: true } } }
    })
    return packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: Number(pkg.price),
      duration: pkg.duration,
      imageUrl: pkg.imageUrl,
      createdAt: pkg.createdAt,
      items: pkg.rentalPackageItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity || 0,
        product: { name: item.product.name }
      }))
    }))
  } catch { return [] }
}

async function getServiceSettings() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['services_title', 'services_text', 'services_data'] } }
    })
    return settings.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc }, {} as any)
  } catch { return {} }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function Home() {
  const [heroSettings, products, packages, serviceSettings] = await Promise.all([
    getHeroSettings(), getProducts(), getPackages(), getServiceSettings()
  ])
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedPackages = JSON.parse(JSON.stringify(packages))

  const SITE_URL = 'https://tropictech.online'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Critical: Header NOT lazy loaded per user requirement ── */}
      <Header />

      <main id="main-content" className="flex-1">
        {/* ── LCP: Hero above fold, eager ── */}
        <Hero initialSettings={heroSettings} />

        {/* ── Below fold with Suspense boundaries ── */}
        <Suspense fallback={<div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />}>
          <LandingClient>
            <Products initialProducts={serializedProducts} />
            <Packages initialPackages={serializedPackages} />
          </LandingClient>
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" aria-hidden="true" />}>
          <Services initialSettings={serviceSettings} />
        </Suspense>

        <Suspense fallback={null}>
          <FAQ />
        </Suspense>

        <Suspense fallback={null}>
          <AboutUs />
        </Suspense>

        <Suspense fallback={null}>
          <Reviews />
        </Suspense>
      </main>

      <Footer />

      {/* ── AI chat: client-only, non-blocking ── */}
      <SellerChatBubble />

      {/* ── Structured Data: RentalBusiness (SEO Gold) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RentalBusiness",
            "name": "Tropic Tech - #1 Workstation Rental Bali",
            "description": "Premium workstation and office equipment rental in Bali. High-performance monitors, ergonomic chairs, and desks for digital nomads and remote workers. 5+ years experience with fast island-wide delivery.",
            "url": SITE_URL,
            "telephone": "+6282266574860",
            "email": "tropictechindo@gmail.com",
            "logo": `${SITE_URL}/images/Logo.webp`,
            "image": `${SITE_URL}/images/og-image.webp`,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Jl. Tunjungsari No.8",
              "addressLocality": "Badung",
              "addressRegion": "Bali",
              "postalCode": "80361",
              "addressCountry": "ID"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": -8.6539,
              "longitude": 115.1469
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "18:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Saturday", "Sunday"],
                "opens": "10:00",
                "closes": "16:00"
              }
            ],
            "priceRange": "Rp 50,000 - Rp 2,000,000",
            "currenciesAccepted": "IDR",
            "paymentAccepted": "Cash, Bank Transfer",
            "areaServed": [
              { "@type": "City", "name": "Canggu" },
              { "@type": "City", "name": "Seminyak" },
              { "@type": "City", "name": "Ubud" },
              { "@type": "City", "name": "Denpasar" },
              { "@type": "City", "name": "Kuta" }
            ],
            "sameAs": [
              "https://www.instagram.com/tropictechs",
              "https://wa.me/6282266574860",
              "https://tropictechbali.com"
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Workstation & Office Equipment Rental",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "name": "Monitor Rental Bali",
                  "description": "Standard HD to 4K Ultrawide monitors for rent in Bali. Ideal for digital nomads and remote workers.",
                  "itemOffered": { "@type": "Service", "name": "Monitor Rental (Standard & Ultrawide)" }
                },
                {
                  "@type": "Offer",
                  "name": "Ergonomic Chair Rental Bali",
                  "description": "Premium ergonomic office chairs for rent. Perfect for long remote work sessions in Bali.",
                  "itemOffered": { "@type": "Service", "name": "Ergonomic Office Chair Rental" }
                },
                {
                  "@type": "Offer",
                  "name": "Standing Desk Rental Bali",
                  "description": "Electric standing desks and office tables for rent. Available for daily, weekly, or monthly rental.",
                  "itemOffered": { "@type": "Service", "name": "Standing Desk & Office Table Rental" }
                }
              ]
            }
          })
        }}
      />

      {/* ── Structured Data: FAQPage ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I rent workstation equipment in Bali?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Browse our products on tropictech.online, select your rental duration (daily, weekly, or monthly), and place an order. We offer fast delivery across Bali including Canggu, Ubud, Seminyak, and Denpasar."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer ergonomic chairs for rent in Bali?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we provide premium ergonomic office chairs specifically designed for long hours of remote work. Available for daily, weekly, or monthly rental with free delivery in Bali."
                }
              },
              {
                "@type": "Question",
                "name": "What areas in Bali do you deliver to?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We deliver workstation equipment across all of Bali, including Canggu, Seminyak, Ubud, Denpasar, Kuta, Legian, Sanur, and Jimbaran."
                }
              },
              {
                "@type": "Question",
                "name": "Can I rent a complete workstation setup in Bali?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! We offer complete workstation packages that include a monitor, ergonomic chair, and standing desk. Packages are available for digital nomads, remote workers, and businesses needing temporary office setups in Bali."
                }
              }
            ]
          })
        }}
      />

      {/* ── Structured Data: WebSite with SearchAction ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Tropic Tech",
            "url": SITE_URL,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${SITE_URL}/?s={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </div>
  )
}
