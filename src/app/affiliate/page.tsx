import React from 'react';
import { Metadata } from 'next';
import Header from '@/components/header/Header';
import Footer from '@/components/landing/Footer';
import AffiliateForm from '@/components/landing/AffiliateForm';
import { db } from '@/lib/db';
import Image from 'next/image';

export const metadata: Metadata = {
    title: 'Affiliate Program | PT Tropic Tech International',
    description: 'Join the Tropic Tech Affiliate Program and earn high commissions by referring our premium equipment rental services in Bali.',
    alternates: {
        canonical: 'https://tropictech.online/affiliate'
    }
};

export const revalidate = 0; // 10 minutes

// The Default 7-Section layout for the Affiliate page
const DEFAULT_AFFILIATE_CONTENT = {
    hero: {
        title: "Partner With Tropic Tech",
        subtitle: "Join Bali's leading equipment rental affiliate program and earn substantial commissions on successful referrals.",
        image: "/images/hero.webp"
    },
    about: {
        title: "What is the Affiliate Program?",
        description: "The PT Tropic Tech International Affiliate Program is a revenue-sharing partnership designed for content creators, agencies, and businesses operating in Bali. When you refer clients to our premium laptop and event equipment rental services, you earn a percentage of the total rental value."
    },
    howItWorks: {
        title: "How It Works",
        steps: [
            { icon: "1", title: "Sign Up", description: "Fill out the application form below. Our team reviews applications within 48 hours." },
            { icon: "2", title: "Share Your Link", description: "Receive your unique promotional materials and custom tracking codes." },
            { icon: "3", title: "Earn Commissions", description: "Get paid monthly for every successful rental originating from your referrals." }
        ]
    },
    commission: {
        title: "Lucrative Commission Structure",
        description: "We believe in rewarding our partners handsomely. Our tiered structure ensures that the more volume you drive, the higher your percentage.",
        rate: "Up to 15%",
        subtext: "on all completed rental orders."
    },
    whoCanJoin: {
        title: "Who Should Join?",
        roles: [
            "Digital Nomad Influencers & Bloggers",
            "Coworking Spaces & Hubs in Bali",
            "Event Organizers & Wedding Planners",
            "Corporate Relocation Agencies"
        ]
    },
    benefits: {
        title: "Exclusive Partner Benefits",
        items: [
            "Lifetime cookie duration of 90 days.",
            "Dedicated B2B Affiliate Manager.",
            "High-converting promotional assets (banners, videos).",
            "Automated monthly payouts directly to your local or international bank."
        ]
    }
};

export default async function AffiliatePage() {
    // Attempt to grab live content from Admin CMS Settings, fallback to DEFAULT
    const savedSetting = await db.siteSetting.findUnique({ where: { key: 'affiliate_content' } });
    let pageData = DEFAULT_AFFILIATE_CONTENT;

    if (savedSetting && savedSetting.value) {
        try {
            // Merge in case some fields are missing
            const parsed = typeof savedSetting.value === 'string' ? JSON.parse(savedSetting.value) : savedSetting.value;
            pageData = { ...DEFAULT_AFFILIATE_CONTENT, ...parsed };
        } catch (e) {
            console.error("Failed to parse affiliate_content from SiteSetting", e);
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />

            {/* Section 1: Hero */}
            <section className="relative overflow-hidden bg-blue-900 text-white pt-32 pb-24 px-6">
                <div className="absolute inset-0 bg-black/40 z-10" />
                {/* Fallback pattern if image is missing */}
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

                <div className="relative z-20 max-w-5xl mx-auto text-center">
                    <div className="inline-block bg-blue-600/30 border border-blue-400/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-blue-100 font-semibold text-sm mb-6 uppercase tracking-wider">
                        Official Partner Program
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        {pageData.hero.title}
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {pageData.hero.subtitle}
                    </p>
                    <a
                        href="#apply"
                        className="inline-flex items-center justify-center h-14 px-8 rounded-full text-lg font-bold bg-white text-blue-900 shadow-xl shadow-blue-900/20 hover:bg-gray-50 hover:scale-105 transition-all duration-300"
                    >
                        Apply Now
                    </a>
                </div>
            </section>

            {/* Section 2: About Program */}
            <section className="py-20 px-6 max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{pageData.about.title}</h2>
                <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full mb-8"></div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {pageData.about.description}
                </p>
            </section>

            {/* Section 3: How It Works */}
            <section className="bg-muted/30 py-24 px-6 border-y border-border">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{pageData.howItWorks.title}</h2>
                        <p className="text-muted-foreground">Three simple steps to start earning.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-200 z-0"></div>

                        {pageData.howItWorks.steps.map((step, idx) => (
                            <div key={idx} className="relative z-10 text-center group">
                                <div className="w-24 h-24 mx-auto bg-card border-4 border-blue-100 dark:border-blue-900/30 rounded-full flex items-center justify-center text-3xl font-black text-blue-600 mb-6 shadow-sm group-hover:scale-110 group-hover:border-blue-300 transition-all duration-300">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4 & 5: Commission & Who Can Join */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Structure */}
                    <div className="bg-blue-900 rounded-[2rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full opacity-50 blur-3xl"></div>
                        <h2 className="text-3xl font-bold mb-6 relative z-10">{pageData.commission.title}</h2>
                        <p className="text-blue-100 mb-8 max-w-md relative z-10 text-lg">
                            {pageData.commission.description}
                        </p>
                        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-8 relative z-10">
                            <div className="text-5xl font-black text-yellow-400 mb-2">{pageData.commission.rate}</div>
                            <div className="text-blue-100 text-lg font-medium tracking-wide uppercase">{pageData.commission.subtext}</div>
                        </div>
                    </div>

                    {/* Who can join */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{pageData.whoCanJoin.title}</h2>
                        <ul className="space-y-6">
                            {pageData.whoCanJoin.roles.map((role, idx) => (
                                <li key={idx} className="flex items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-semibold text-foreground/80">{role}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 6: Benefits */}
            <section className="bg-blue-500/5 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{pageData.benefits.title}</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to successfully promote and track your performance.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pageData.benefits.items.map((benefit: string, idx: number) => (
                            <div key={idx} className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-yellow-500/10 text-yellow-600 rounded-xl flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-foreground">{benefit}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 7: Form */}
            <section id="apply" className="py-24 px-6 relative">
                <div className="absolute inset-0 bg-slate-950 -skew-y-3 origin-bottom-left transform-gpu z-0"></div>
                <div className="max-w-4xl mx-auto relative z-10 bg-card rounded-3xl shadow-2xl overflow-hidden border border-border">
                    <div className="p-10 md:p-14">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Submit Your Application</h2>
                            <p className="text-muted-foreground text-lg">Join the network and start monetizing your Bali footprint today.</p>
                        </div>
                        <AffiliateForm />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
