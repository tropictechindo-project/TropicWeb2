import dynamic from 'next/dynamic'
import Header from '@/components/header/Header'
import Hero from '@/components/landing/Hero'
import LandingClient from '@/components/landing/LandingClient'

import { db } from '@/lib/db'

// Dynamically import below-the-fold components
const Products = dynamic(() => import('@/components/landing/Products'))
const Packages = dynamic(() => import('@/components/landing/Packages'))
const Services = dynamic(() => import('@/components/landing/Services'))
const FAQ = dynamic(() => import('@/components/landing/FAQ'))
const AboutUs = dynamic(() => import('@/components/landing/AboutUs'))
const Reviews = dynamic(() => import('@/components/landing/Reviews'))
const Footer = dynamic(() => import('@/components/landing/Footer'))

export const revalidate = 60 // Revalidate every minute


async function getHeroSettings() {
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: ['hero_title', 'hero_subtitle', 'hero_subtitle2', 'hero_image', 'hero_opacity_default', 'hero_show_slider']
        }
      }
    })

    const settingMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as any)

    return {
      hero_title: settingMap.hero_title,
      hero_subtitle: settingMap.hero_subtitle,
      hero_subtitle2: settingMap.hero_subtitle2,
      hero_image: settingMap.hero_image,
      hero_opacity_default: settingMap.hero_opacity_default,
      hero_show_slider: settingMap.hero_show_slider,
    }
  } catch (error) {
    console.warn('Failed to fetch hero settings:', error)
    return {}
  }
}

async function getProducts() {
  try {
    const products = await db.product.findMany({
      orderBy: {
        monthlyPrice: 'asc', // Sort by price first
      },
    })

    // Custom sort order: Desk -> Monitor -> Chair -> Others
    const categoryOrder = { 'Desk': 1, 'Monitor': 2, 'Chair': 3 }

    const sortedProducts = products.sort((a, b) => {
      const orderA = categoryOrder[a.category as keyof typeof categoryOrder] || 4
      const orderB = categoryOrder[b.category as keyof typeof categoryOrder] || 4

      if (orderA !== orderB) return orderA - orderB
      return Number(a.monthlyPrice) - Number(b.monthlyPrice)
    })

    return sortedProducts.map(p => ({
      ...p,
      stock: p.stock || 0,
      monthlyPrice: Number(p.monthlyPrice), // Ensure decimal is number for JSON serialization
    }))
  } catch (error) {
    console.warn('Failed to fetch products:', error)
    return []
  }
}

async function getPackages() {
  try {
    const packages = await db.rentalPackage.findMany({
      orderBy: { price: 'desc' }, // Sort by price descending (expensive first)
      take: 3, // Only showing 3 packages (excluding cheapest if sorted desc)
      include: {
        rentalPackageItems: {
          include: {
            product: true
          }
        }
      }
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
        product: {
          name: item.product.name
        }
      }))
    }))
  } catch (error) {
    console.warn('Failed to fetch packages:', error)
    return []
  }
}

async function getServiceSettings() {
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: ['services_title', 'services_text', 'services_data']
        }
      }
    })
    const settingMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as any)
    return settingMap
  } catch (error) {
    console.warn('Failed to fetch service settings:', error)
    return {}
  }
}

export default async function Home() {
  const [heroSettings, products, packages, serviceSettings] = await Promise.all([
    getHeroSettings(),
    getProducts(),
    getPackages(),
    getServiceSettings()
  ])

  // Serialize to ensure no Decimal/Date objects are passed
  const serializedProducts = JSON.parse(JSON.stringify(products))
  const serializedPackages = JSON.parse(JSON.stringify(packages))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero initialSettings={heroSettings} />
        <LandingClient>
          <Products initialProducts={serializedProducts} />
          <Packages initialPackages={serializedPackages} />
        </LandingClient>
        <Services initialSettings={serviceSettings} />

        <FAQ />
        <AboutUs />
        <Reviews />
      </main>
      <Footer />

      {/* Enhanced Structured Data for SEO Gold Status */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RentalBusiness",
            "name": "Tropic Tech - #1 Workstation Rental Bali",
            "description": "Premium workstation and office equipment rental in Bali. High-performance monitors, ergonomic chairs, and desks for digital nomads. 5+ years experience with fast island-wide delivery.",
            "url": "https://testdomain.fun",
            "telephone": "+6282266574860",
            "email": "tropictechindo@gmail.com",
            "logo": "https://i.ibb.co.am/Pzbsg8mx/2.jpg",
            "image": "https://i.ibb.co.am/Pzbsg8mx/2.jpg",
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
            "sameAs": [
              "https://www.instagram.com/tropictechs",
              "https://wa.me/6282266574860"
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Workstation & Office Rental Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Monitor Rental (Standard & Ultrawide)"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Ergonomic Office Chair Rental"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Standing Desk & Office Table Rental"
                  }
                }
              ]
            }
          })
        }}
      />
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
                  "text": "Browse our products on testdomain.fun, select your duration (daily/weekly/monthly), and place an order. We offer fast delivery across Bali including Canggu, Ubud, and Seminyak."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer ergonomic chairs for rent?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we provide premium ergonomic office chairs from top brands like ErgoChair and Sihoo, specifically designed for long hours of remote work."
                }
              }
            ]
          })
        }}
      />
    </div>
  )
}
