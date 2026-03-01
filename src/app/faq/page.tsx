import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Frequently Asked Questions | Rental Equipment Bali | Tropic Tech',
    description: 'Got questions about renting laptops, monitors, or event equipment in Bali? Read our comprehensive FAQ covering pricing, delivery, liability, and long-term tech rentals.',
    alternates: {
        canonical: 'https://tropictech.online/faq'
    }
};

import { db } from '@/lib/db';

async function getFaqData() {
    try {
        const settings = await db.siteSetting.findMany({
            where: {
                key: { in: ['faq_title', 'faq_text', 'faq_data'] }
            }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, any>);

        const dbFaqs = settingsMap.faq_data || [];

        // If we have DB FAQs, map them into the category structure
        if (dbFaqs.length > 0) {
            const categories: Record<string, any[]> = {};

            dbFaqs.forEach((faq: any) => {
                const cat = faq.category || "General Information";
                if (!categories[cat]) categories[cat] = [];
                // Standardize on full names
                categories[cat].push({
                    question: faq.question || faq.q,
                    answer: faq.answer || faq.a
                });
            });

            return {
                title: settingsMap.faq_title || 'Frequently Asked Questions',
                description: settingsMap.faq_text || 'Everything you need to know about renting office and IT equipment in Bali.',
                faqs: Object.entries(categories).map(([name, questions]) => ({
                    category: name,
                    questions
                }))
            };
        }
    } catch (e) {
        console.error("Failed to fetch FAQ settings", e);
    }

    // Default fallback
    return {
        title: 'Frequently Asked Questions',
        description: 'Everything you need to know about renting office and IT equipment in Bali.',
        faqs: [
            {
                category: "Order Flow & Fulfillment",
                questions: [
                    {
                        question: "How does Tropic Tech Bali's equipment rental work?",
                        answer: "Our process is simple. Browse our inventory on the website, select the products or packages you need, and proceed to checkout. Once your request is received and payment is verified, our dispatch team schedules a delivery directly to your location in Bali."
                    },
                    {
                        question: "How quickly can I receive my rented hardware?",
                        answer: "For deliveries within the South Bali corridor (Canggu, Seminyak, Kuta, Jimbaran), we typically process and dispatch within 4 hours during operational hours. Next-day delivery is guaranteed for all standard orders."
                    }
                ]
            },
            {
                category: "Hardware & Setup Policies",
                questions: [
                    {
                        question: "What type of equipment do you rent?",
                        answer: "We specialize in high-end office and IT equipment. Our inventory includes Apple MacBooks (M1/M2/M3 chips), premium Windows workstations, 4K and Ultrawide monitors, ergonomic office chairs (Herman Miller, ErgoTune), motorized standing desks, and enterprise networking gear."
                    }
                ]
            }
        ]
    };
}

export default async function FAQPage() {
    const { title, description, faqs } = await getFaqData();
    // Generate FAQPage JSON-LD
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.flatMap(category =>
            category.questions.map(q => ({
                '@type': 'Question',
                'name': q.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': q.answer
                }
            }))
        )
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col pt-10">
            <Header />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {/* Hero */}
            <section className="bg-background border-b border-border py-16 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
                        {title}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground">
                        {description}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto w-full flex-grow">
                <div className="space-y-16">
                    {faqs.map((category, idx) => (
                        <div key={idx} className="bg-card rounded-3xl p-8 md:p-10 shadow-sm border border-border">
                            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8 pb-4 border-b border-border flex items-center">
                                <span className="bg-blue-50 text-blue-600 rounded-lg p-2 mr-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                {category.category}
                            </h2>

                            <div className="space-y-8">
                                {category.questions.map((item, qIdx) => (
                                    <div key={qIdx} className="prose prose-blue dark:prose-invert max-w-none">
                                        <h3 className="text-xl font-bold text-foreground mb-3">{item.question}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Footer */}
            <section className="bg-blue-900 text-white py-16 px-6 text-center mt-auto">
                <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                <p className="text-blue-200 mb-8 max-w-2xl mx-auto">Our team is active from 08:00 to 24:00 WITA every day. Drop us a message and we'll reply immediately.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-white text-blue-900 font-bold px-8 py-6 text-lg rounded-full hover:bg-gray-100 transition shadow-lg">
                        <Link href="/contact">
                            Contact Support
                        </Link>
                    </Button>
                    <Button asChild size="lg" className="bg-blue-800 text-white font-bold px-8 py-6 text-lg rounded-full hover:bg-blue-700 border border-blue-700 transition">
                        <Link href="/services">
                            View Available Equipment
                        </Link>
                    </Button>
                </div>
            </section>
            <Footer />
        </div>
    );
}

export const revalidate = 0;
