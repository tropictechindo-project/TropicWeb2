import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/landing/ProductCard';
import PackageCard from '@/components/landing/PackageCard';

export const metadata: Metadata = {
    title: 'Equipment Rental Services in Bali | Tropic Tech Bali',
    description: 'Discover premium office, event, and operational equipment rental services in Bali. We offer flexible packages, reliable delivery, and full technical support.',
    alternates: {
        canonical: 'https://tropictech.online/services'
    },
    openGraph: {
        title: 'Equipment Rental Services in Bali | Tropic Tech Bali',
        description: 'Discover premium office, event, and operational equipment rental services in Bali.',
        url: 'https://tropictech.online/services',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Equipment Rental Services in Bali',
        description: 'Discover premium office, event, and operational equipment rental services in Bali.',
    }
};

// Revalidate data periodically to keep it fresh without hitting the DB on every single public request
export const revalidate = 3600; // 1 hour

async function getServicesData() {
    const [productsRaw, packagesRaw, specialOffersRaw, catalogSetting] = await Promise.all([
        db.product.findMany({
            include: { variants: { include: { units: true } } },
            orderBy: { name: 'asc' }
        }),
        db.rentalPackage.findMany({
            include: { rentalPackageItems: { include: { product: true } } },
            orderBy: { price: 'asc' }
        }),
        db.specialOffer.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        }),
        db.siteSetting.findUnique({
            where: { key: 'product_catalog_url' }
        })
    ]);

    const products = productsRaw.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category,
        monthlyPrice: Number(p.monthlyPrice),
        imageUrl: p.imageUrl,
        discountPercentage: p.discountPercentage || 0,
        stock: Math.max(0, p.variants.reduce((t, v) => t + v.units.filter(u => u.status === 'AVAILABLE').length, 0))
    }));

    const packages = packagesRaw.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price: Number(pkg.price),
        duration: pkg.duration,
        imageUrl: pkg.imageUrl,
        discountPercentage: pkg.discountPercentage || 0,
        items: pkg.rentalPackageItems.map(item => ({
            id: item.id,
            quantity: item.quantity || 1,
            product: { name: item.product.name }
        }))
    }));

    const specialOffers = specialOffersRaw.map(o => ({
        id: o.id,
        title: o.title,
        description: o.description || '',
        badgeText: o.badgeText,
        finalPrice: Number(o.finalPrice),
        images: o.images,
    }));

    let catalogUrl = null;
    if (catalogSetting && catalogSetting.value) {
        catalogUrl = typeof catalogSetting.value === 'string' ? catalogSetting.value : (catalogSetting.value as any)?.url || catalogSetting.value;
    }

    return { products, packages, specialOffers, catalogUrl };
}

export default async function ServicesPage() {
    const { products, packages, specialOffers, catalogUrl } = await getServicesData();

    // Create JSON-LD schema
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': [
            ...products.map((p, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'item': {
                    '@type': 'Product',
                    'name': p.name,
                    'description': p.description,
                    'image': p.imageUrl || '',
                    'category': p.category,
                    'offers': {
                        '@type': 'Offer',
                        'price': p.monthlyPrice.toString(),
                        'priceCurrency': 'IDR',
                        'availability': 'https://schema.org/InStock'
                    }
                }
            })),
            ...packages.map((p, index) => ({
                '@type': 'ListItem',
                'position': products.length + index + 1,
                'item': {
                    '@type': 'Product',
                    'name': p.name,
                    'description': p.description,
                    'image': p.imageUrl || '',
                    'offers': {
                        '@type': 'Offer',
                        'price': p.price.toString(),
                        'priceCurrency': 'IDR'
                    }
                }
            }))
        ]
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* 1. Hero Section */}
            <section className="bg-blue-900 text-white py-20 px-6 md:px-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 z-10" />
                <div className="relative z-20 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Equipment Rental Services in Bali <br className="hidden md:block" />Tropic Tech Bali
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Providing enterprise-grade laptops, ergonomic office setups, and event hardware tailored for digital nomads and businesses in Indonesia.
                    </p>
                    {catalogUrl ? (
                        <Button asChild size="lg" className="rounded-full shadow-lg font-bold px-8 py-6 text-lg">
                            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                Download Catalog Products
                            </a>
                        </Button>
                    ) : (
                        <Button asChild size="lg" className="rounded-full shadow-lg font-bold px-8 py-6 text-lg">
                            <Link href="/contact">
                                Contact Our Team For Custom Quotes
                            </Link>
                        </Button>
                    )}
                </div>
            </section>

            {/* 2. Office Equipment Rental */}
            <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Office Equipment & Hardware</h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        Whether you need a fleet of high-performance Apple MacBooks or Windows workstations, our individual product offerings ensure you have exactly the horsepower required for your operations. All devices come pre-serviced and fully updated.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            {/* 3 & 4. Work From Anywhere / Event Equipment - Unified Context */}
            <section className="bg-white py-16 px-6 md:px-12 w-full border-y border-gray-100">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Work From Anywhere Setup Bali</h2>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Bali is the global hub for remote work. Tropic Tech makes transitioning seamless by delivering complete ergonomic setups straight to your villa or coworking space. We handle the heavy lifting, cable management, and hardware troubleshooting so you can focus on productivity.
                        </p>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">Event & Operational Equipment</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Hosting a corporate retreat, hackathon, or large-scale conference in Indonesia? We provide bulk rentals of laptops, projectors, networking hardware, and seating arrangements with rapid on-site technical deployment.
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-3xl p-8 relative overflow-hidden min-h-[400px] flex items-center justify-center">
                        {/* Visual Placeholder for SEO context */}
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-900 mb-2">Corporate SLAs Available</h3>
                            <p className="text-blue-700">Enterprise support with 2-hour hardware replacement guarantees across South Bali.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Rental Packages */}
            {packages.length > 0 && (
                <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">All-in-One Rental Packages</h2>
                        <p className="text-gray-600 max-w-3xl mx-auto">
                            Save money and time with our curated bundles. Perfect for new arrivals or teams setting up temporary offices.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map(pkg => (
                            <div key={pkg.id}>
                                <PackageCard package={pkg} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 6. Special Offers */}
            {specialOffers.length > 0 && (
                <section className="py-16 px-6 md:px-12 bg-blue-50 w-full relative overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Seasonal Special Offers</h2>
                            <p className="text-gray-600 max-w-3xl mx-auto">Limited time deals available for immediate deployment.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                            {specialOffers.map(offer => (
                                <div key={offer.id} className="bg-white rounded-2xl shadow-lg border border-yellow-200 overflow-hidden relative">
                                    {offer.badgeText && (
                                        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full z-10 uppercase tracking-wide shadow-sm">
                                            {offer.badgeText}
                                        </div>
                                    )}
                                    {offer.images && offer.images.length > 0 && (
                                        <div className="relative h-48 w-full bg-gray-50">
                                            <Image
                                                src={offer.images[0]}
                                                alt={offer.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{offer.description}</p>
                                        <p className="font-bold text-xl text-blue-600">Rp {Number(offer.finalPrice).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 7. Final Banner */}
            <section className="bg-gray-900 text-white py-16 px-6 text-center">
                <h2 className="text-3xl font-bold mb-6">Ready to upgrade your workspace?</h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Skip the logistics of buying hardware. Rent premium equipment from Tropic Tech Bali today.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="rounded-full shadow-lg font-bold px-8 py-6 text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30">
                        <Link href="/products">
                            Download Products/Catalog
                        </Link>
                    </Button>
                    {catalogUrl && (
                        <Button asChild size="lg" variant="outline" className="rounded-full shadow-lg font-bold px-8 py-6 text-lg border-blue-500 text-blue-400 hover:bg-gray-800 hover:text-white">
                            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                Download Product Catalog
                            </a>
                        </Button>
                    )}
                </div>
            </section>
            <Footer />
        </div>
    );
}
