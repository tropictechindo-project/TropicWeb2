import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

export const metadata: Metadata = {
    title: 'About PT Tropic Tech International | Equipment Rentals Bali',
    description: 'Learn about PT Tropic Tech International, Bali\'s premier enterprise IT and office equipment rental service serving remote workers, digital nomads, and corporate events.',
    alternates: {
        canonical: 'https://tropictech.online/about'
    }
};

async function getAboutData() {
    const [catalogSetting, aboutSetting] = await Promise.all([
        db.siteSetting.findUnique({ where: { key: 'product_catalog_url' } }),
        db.siteSetting.findUnique({ where: { key: 'about_page_content' } })
    ]);

    let catalogUrl = null;
    if (catalogSetting && catalogSetting.value) {
        catalogUrl = typeof catalogSetting.value === 'string' ? catalogSetting.value : (catalogSetting.value as any)?.url || catalogSetting.value;
    }

    let aboutData = {
        title: "Powering Bali's Digital Workforce",
        subtitle: "We are Bali's leading infrastructure provider for remote workers, digital nomads, and enterprise events. We deliver the hardware so you can deliver the results.",
        missionTitle: "The Tropic Tech Vision",
        missionP1: "Founded in Bali, PT Tropic Tech International was built to solve a critical bottleneck: accessing reliable, high-performance hardware on an island. Prior to our launch, digital professionals faced massive import taxes or risky local purchases just to work efficiently.",
        missionP2: "Our mission is to democratize access to premium technology through flexible, fully-managed rental services. We ensure that whether you are a solo developer in Canggu or a massive tech retreat in Nusa Dua, your hardware works flawlessly."
    };

    if (aboutSetting && aboutSetting.value) {
        try {
            const parsed = typeof aboutSetting.value === 'string' ? JSON.parse(aboutSetting.value) : aboutSetting.value;
            aboutData = { ...aboutData, ...parsed };
        } catch (e) {
            console.error("Failed to parse about_page_content", e);
        }
    }

    return { catalogUrl, aboutData };
}

export default async function AboutPage() {
    const { catalogUrl, aboutData } = await getAboutData();

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'PT Tropic Tech International',
        'alternateName': 'Tropic Tech Bali',
        'url': 'https://tropictech.online',
        'logo': 'https://tropictech.online/logo.png', // Fallback URL, assuming typical structure
        'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+62-800-000-0000', // Placeholder as exact wasn't in COMPREHANSIVE_DATA
            'contactType': 'customer service',
            'email': 'contact@tropictech.online',
            'areaServed': 'ID',
            'availableLanguage': ['English', 'Indonesian']
        },
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Bali',
            'addressCountry': 'ID'
        },
        'description': 'Bali based enterprise IT and office equipment rental service.',
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Hero */}
            <section className="bg-gray-900 text-white py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-gray-900 to-black" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">PT Tropic Tech International</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        {aboutData.title}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        {aboutData.subtitle}
                    </p>
                </div>
            </section>

            {/* Intro & Vision */}
            <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-6">{aboutData.missionTitle}</h2>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
                        {aboutData.missionP1}
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                        {aboutData.missionP2}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-500/10 rounded-3xl p-8 flex flex-col justify-center text-center aspect-square">
                        <span className="text-4xl font-extrabold text-blue-600 mb-2">24h</span>
                        <span className="text-muted-foreground font-medium">Hardware Swap SLA</span>
                    </div>
                    <div className="bg-muted rounded-3xl p-8 flex flex-col justify-center text-center aspect-square mt-8">
                        <span className="text-4xl font-extrabold text-foreground mb-2">100+</span>
                        <span className="text-muted-foreground font-medium">Premium Asset Fleet</span>
                    </div>
                    <div className="bg-muted rounded-3xl p-8 flex flex-col justify-center text-center aspect-square mt-[-2rem]">
                        <span className="text-4xl font-extrabold text-foreground mb-2">Zero</span>
                        <span className="text-muted-foreground font-medium">Maintenance Stress</span>
                    </div>
                    <div className="bg-blue-900 rounded-3xl p-8 flex flex-col justify-center text-center aspect-square text-white">
                        <span className="text-4xl font-extrabold text-blue-400 mb-2">100%</span>
                        <span className="text-blue-100 font-medium">System Operated</span>
                    </div>
                </div>
            </section>

            {/* Core Values & Ops Model */}
            <section className="bg-muted/30 py-20 px-6 w-full border-y border-border">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Operational Model</h2>
                        <p className="text-muted-foreground max-w-3xl mx-auto">We don&apos;t just rent monitors; we run an advanced logistics ecosystem.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 content-stretch">
                        <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Serial Tracking</h3>
                            <p className="text-muted-foreground">Every single MacBook, monitor, and desk is tracked individually by serial number in our database, monitoring service history, battery health, and hardware faults.</p>
                        </div>
                        <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Internal Dispatch System</h3>
                            <p className="text-muted-foreground">Our native field-worker application maps and routes hardware directly to your villa or office via Google Maps ETA linking, ensuring absolute delivery transparency.</p>
                        </div>
                        <div className="bg-card p-8 rounded-3xl shadow-sm border border-border">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">AI Sales Engine</h3>
                            <p className="text-muted-foreground">Behind the scenes, PT Tropic Tech International employs a fully autonomous AI risk and sales assessment architecture to speed up quoting and ensure you have the exact hardware needed.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Coverage */}
            <section className="py-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">Service Coverage Area</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mb-12">
                    Headquartered in Bali, our rapid-deployment fleet covers the entire southern corridor.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    {['Canggu', 'Seminyak', 'Kuta', 'Legian', 'Jimbaran', 'Uluwatu', 'Nusa Dua', 'Sanur', 'Denpasar', 'Ubud'].map(area => (
                        <span key={area} className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-6 py-3 rounded-full font-semibold">
                            {area}
                        </span>
                    ))}
                </div>
            </section>

            {/* CTA Footer */}
            <section className="bg-blue-900 text-white py-16 px-6 text-center">
                <h2 className="text-3xl font-bold mb-6">Partner With Tropic Tech</h2>
                <p className="text-blue-200 mb-8 max-w-2xl mx-auto">Equip your team with zero capital expenditure.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="bg-white text-blue-900 font-bold px-8 py-6 text-lg rounded-full hover:bg-gray-100 transition shadow-lg">
                        <Link href="/services">
                            Explore Full Catalog
                        </Link>
                    </Button>
                    {catalogUrl && (
                        <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-900 font-bold px-8 py-6 text-lg rounded-full transition shadow-lg">
                            <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                Download Company Catalog
                            </a>
                        </Button>
                    )}
                </div>
                <div className="mt-12 text-sm text-blue-300 font-medium">
                    PT Tropic Tech International &bull; Legal and Registered Company No. 1712240076832 (NIB)
                </div>
            </section>
            <Footer />
        </div>
    );
}

export const revalidate = 0;
