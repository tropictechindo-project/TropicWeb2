import Header from '@/components/header/Header'
import Hero from '@/components/landing/Hero'
import LandingClient from '@/components/landing/LandingClient'
import { db } from '@/lib/db'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// ─── Below-fold: dynamic imports with skeletons ───
const Products = dynamic(() => import('@/components/landing/Products'), {
  loading: () => <div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const Packages = dynamic(() => import('@/components/landing/Packages'), {
  loading: () => <div className="h-80 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const SpecialOffers = dynamic(() => import('@/components/landing/SpecialOffers'), {
  loading: () => <div className="h-80 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const TrackerSection = dynamic(() => import('@/components/landing/TrackerSection'), {
  loading: () => <div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const Services = dynamic(() => import('@/components/landing/Services'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const AboutUs = dynamic(() => import('@/components/landing/AboutUs'), {
  loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const Reviews = dynamic(() => import('@/components/landing/Reviews'), {
  loading: () => <div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const ContactLandingSection = dynamic(() => import('@/components/landing/ContactLandingSection'), {
  loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const ClientLogos = dynamic(() => import('@/components/landing/ClientLogos'), {
  loading: () => <div className="h-48 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection'), {
  loading: () => <div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
})
const RealSetupGallery = dynamic(() => import('@/components/landing/RealSetupGallery'), {
  loading: () => <div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />,
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
      include: { rentalPackageItems: { include: { product: true } } }
    })
    const result = packages.map(pkg => ({
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
    // console.log('--- DEBUG PACKAGES ---', JSON.stringify(result, null, 2))
    return result

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

async function getSpecialOffersSettings() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['special_offers_title', 'special_offers_description'] } }
    })
    return settings.reduce((acc, curr) => { acc[curr.key] = curr.value; return acc }, {} as any)
  } catch { return {} }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function Home() {
  const [heroSettings, products, packages, serviceSettings, specialOffersSettings] = await Promise.all([
    getHeroSettings(), getProducts(), getPackages(), getServiceSettings(), getSpecialOffersSettings()
  ])
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedPackages = JSON.parse(JSON.stringify(packages))

  const SITE_URL = 'https://tropictech.rent'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Critical: Header NOT lazy loaded per user requirement ── */}
      <Header />

      <main id="main-content" className="flex-1">
        {/* ── LCP: Hero above fold, eager ── */}
        <Hero initialSettings={heroSettings} />

        {/* ── Below fold with Suspense boundaries ── */}
        <Suspense fallback={<div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />}>
          <LandingClient>
            <Products initialProducts={serializedProducts} />
            <Packages initialPackages={serializedPackages} />
          </LandingClient>
        </Suspense>

        <Suspense fallback={<div className="h-80 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />}>
          <SpecialOffers initialSettings={specialOffersSettings} />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />}>
          <TrackerSection />
        </Suspense>

        <Suspense fallback={null}>
          <RealSetupGallery />
        </Suspense>

        <Suspense fallback={<div className="h-64 bg-muted/20 animate-pulse rounded-lg mx-4 my-8" />}>
          <Services initialSettings={serviceSettings} />
        </Suspense>

        <Suspense fallback={null}>
          <FAQ />
        </Suspense>

        <Suspense fallback={null}>
          <AboutUs />
        </Suspense>

        <Suspense fallback={null}>
          <ClientLogos />
        </Suspense>

        <Suspense fallback={null}>
          <Reviews />
        </Suspense>

        <Suspense fallback={null}>
          <ContactLandingSection />
        </Suspense>
      </main>

      <Footer />

      {/* ── Structured Data: Comprehensive RentalBusiness (SEO Gold) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["LocalBusiness", "RentalBusiness", "ProfessionalService"],
            "@id": `${SITE_URL}/#organization`,
            "name": "Tropic Tech",
            "alternateName": ["PT TTI", "Tropic Tech Rental", "Bali Help Organization", "Remote Work Setup Bali"],
            "legalName": "PT Tropic Tech International™",
            "foundingDate": "2021",
            "description": "Bali's leading remote work infrastructure service since 2021. Originally founded under Bali Help Organization, we formalized as PT Tropic Tech International in 2024. Rent ergonomic chairs, standing desks, and monitors with 24-hour delivery in Canggu, Ubud, and Seminyak.",
            "url": SITE_URL,
            "telephone": "+6282266574860",
            "email": [
              "contact@tropictech.online",
              "tropictechindo@gmail.com",
              "support@tropictech.online"
            ],
            "logo": `${SITE_URL}/images/Logo.webp`,
            "image": `${SITE_URL}/images/og-image.webp`,
            "taxID": "287935548901000",
            "identifier": [
              { "@type": "PropertyValue", "name": "NIB", "value": "1712240076832" },
              { "@type": "PropertyValue", "name": "AHU", "value": "AHU-0100025.AH.01.01.TAHUN 2024" }
            ],
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
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+6282266574860",
              "email": "support@tropictech.online",
              "contactType": "customer service",
              "contactOption": "HearingImpairedSupported",
              "areaServed": "ID",
              "availableLanguage": ["Indonesian", "English"]
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
            "paymentAccepted": "Cash, Bank Transfer, QRIS, Credit Card",
            "areaServed": [
              { "@type": "City", "name": "Canggu", "description": "Active Coverage" },
              { "@type": "City", "name": "Seminyak", "description": "Active Coverage" },
              { "@type": "City", "name": "Ubud", "description": "Active Coverage" },
              { "@type": "City", "name": "Denpasar", "description": "Active Coverage" },
              { "@type": "City", "name": "Kuta", "description": "Active Coverage" },
              { "@type": "City", "name": "Uluwatu", "description": "Active Coverage" },
              { "@type": "City", "name": "Sanur", "description": "Active Coverage" },
              { "@type": "City", "name": "Lombok", "description": "Planned Expansion (2027)" },
              { "@type": "City", "name": "Jakarta", "description": "Planned Branch Office (2027)" },
              { "@type": "Country", "name": "Thailand", "description": "Planned Regional Expansion (2028)" },
              { "@type": "Country", "name": "Vietnam", "description": "Planned Regional Expansion (2029)" }
            ],
            "sameAs": [
              "https://www.instagram.com/tropictech",
              "https://www.instagram.com/tropictecs",
              "https://wa.me/6282266574860",
              "https://maps.app.goo.gl/2kVDL5NdqGjh8qBG8",
              "https://tropictech.rent",
              "https://tropic-tech.odoo.com",
              "https://balihelp.id",
              "https://indonesianvisas.com"
            ],
            "parentOrganization": {
              "@type": "Corporation",
              "@id": "https://indonesianvisas.com/#organization",
              "name": "Indonesian Visas",
              "alternateName": ["MYVISA", "PT MYVISA"],
              "legalName": "PT Indonesian Visas Agency",
              "taxID": "0100000008117681",
              "url": "https://indonesianvisas.com",
              "parentOrganization": {
                "@type": "Corporation",
                "@id": "https://bali.enterprises/#organization",
                "name": "Bali Enterprises",
                "alternateName": ["EBALI", "PT EBALI"],
                "legalName": "PT Bali Enterprises Group",
                "url": "https://bali.enterprises"
              }
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Remote Work Setup & Digital Nomad Equipment Rental Bali",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "name": "Rent a Monitor in Bali",
                  "description": "Standard HD to 4K Ultrawide monitors for rent in Bali. Ideal for digital nomads and remote workers.",
                  "priceCurrency": "IDR",
                  "price": "100000",
                  "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  "availability": "https://schema.org/InStock",
                  "seller": { "@type": "Organization", "name": "Tropic Tech", "url": "https://tropictech.rent" },
                  "itemOffered": { "@type": "Service", "name": "Monitor Rental Bali" }
                },
                {
                  "@type": "Offer",
                  "name": "Rent a Chair in Bali (Ergonomic)",
                  "description": "Premium ergonomic office chairs for rent. Perfect for long remote work sessions in Bali.",
                  "priceCurrency": "IDR",
                  "price": "100000",
                  "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  "availability": "https://schema.org/InStock",
                  "seller": { "@type": "Organization", "name": "Tropic Tech", "url": "https://tropictech.rent" },
                  "itemOffered": { "@type": "Service", "name": "Ergonomic Office Chair Rental Bali" }
                },
                {
                  "@type": "Offer",
                  "name": "Rent a Desk in Bali (Standing Desk)",
                  "description": "Electric standing desks and office tables for rent. Available for daily, weekly, or monthly rental.",
                  "priceCurrency": "IDR",
                  "price": "100000",
                  "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  "availability": "https://schema.org/InStock",
                  "seller": { "@type": "Organization", "name": "Tropic Tech", "url": "https://tropictech.rent" },
                  "itemOffered": { "@type": "Service", "name": "Standing Desk Rental Bali" }
                }
              ]
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "124"
            },
            "founder": {
              "@type": "Person",
              "name": "Bayu Damopolii-Manoppo",
              "jobTitle": "Co-Founder & Commissioner",
              "email": "cfo@tropictech.online",
              "url": "https://www.linkedin.com/in/balihelp/",
              "sameAs": ["https://www.linkedin.com/in/bayu-damopolii-887ab883/"]
            }
          })
        }}
      />

      {/* ── Structured Data: FAQPage (Keyword Optimized) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How to rent a setup for work in Bali?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To rent a setup for work in Bali, browse our products on tropictech.rent, select your equipment (monitors, chairs, or standing desks), and place an order. We offer 24-hour delivery across Bali."
                }
              },
              {
                "@type": "Question",
                "name": "Can I rent a digital nomad setup in Bali?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Tropic Tech specializes in digital nomad setup rentals in Bali. You can rent a desk, chair, and monitor as a package for your remote work needs."
                }
              },
              {
                "@type": "Question",
                "name": "Is it possible to rent a remote workspace in Bali at my villa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. Tropic Tech delivers high-performance office equipment directly to your villa or hotel, helping you rent a remote workspace in Bali without any hassle."
                }
              },
              {
                "@type": "Question",
                "name": "Where can I rent a monitor in Bali with fast delivery?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can rent a monitor in Bali with 24-hour delivery from Tropic Tech. We serve Canggu, Ubud, Seminyak, Uluwatu, and other major areas."
                }
              }
            ]
          })
        }}
      />

      {/* ── Structured Data: BreadcrumbList (Rich Snippets) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": `${SITE_URL}/products`
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
