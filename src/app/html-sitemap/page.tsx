'use client'

import React from 'react'
import Link from 'next/link'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin, ShoppingBag, Info, ShieldAlert, FileText, ChevronRight } from 'lucide-react'

const sitemapData = [
    {
        category: 'Core Pages',
        icon: <ShoppingBag className="h-5 w-5 text-primary" />,
        links: [
            { title: 'Home', href: '/' },
            { title: 'Products / Catalog', href: '/products' },
            { title: 'Checkout', href: '/checkout' },
            { title: 'Order Tracking', href: '/tracking' },
        ],
    },
    {
        category: 'High Intent Rentals (SEO)',
        icon: <MapPin className="h-5 w-5 text-emerald-500" />,
        links: [
            { title: 'Monitor Rental Bali', href: '/rent-monitor-bali' },
            { title: 'Workstation Rental Bali', href: '/rent-workstation-bali' },
            { title: 'Office Rental Bali', href: '/rent-office-bali' },
            { title: 'Desk Rental Bali', href: '/rent-desk-bali' },
            { title: 'Chair Rental Bali', href: '/rent-chair-bali' },
        ],
    },
    {
        category: 'Solution Workspaces (SEO)',
        icon: <Info className="h-5 w-5 text-blue-500" />,
        links: [
            { title: 'Remote Work Setup Bali', href: '/remote-work-setup-bali' },
            { title: 'Digital Nomad Workspace', href: '/digital-nomad-workspace-bali' },
            { title: 'Startup Office Setup', href: '/startup-office-setup-bali' },
            { title: 'Event Workstation Rental', href: '/event-workstation-rental-bali' },
            { title: 'Temporary Office Bali', href: '/temporary-office-bali' },
        ],
    },
    {
        category: 'Legal & Policy',
        icon: <ShieldAlert className="h-5 w-5 text-amber-500" />,
        links: [
            { title: 'Privacy Policy', href: '/privacy-policy' },
            { title: 'Terms & Conditions', href: '/terms-conditions' },
            { title: 'Refund Policy', href: '/refund-policy' },
        ],
    },
]

export default function SitemapPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
                            Sitemap
                        </h1>
                        <p className="text-muted-foreground">
                            Navigate all our high-performance equipment pages and workspace setup guides in Bali.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {sitemapData.map((section, idx) => (
                            <Card key={idx} className="bg-card border-border/50 shadow-xl shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                                <CardHeader className="flex flex-row items-center gap-3 border-b border-border/10 pb-4">
                                    {section.icon}
                                    <CardTitle className="text-lg font-bold tracking-tight">{section.category}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ul className="space-y-3">
                                        {section.links.map((link, lIdx) => (
                                            <li key={lIdx}>
                                                <Link 
                                                    href={link.href} 
                                                    className="flex items-center justify-between text-muted-foreground hover:text-primary hover:font-semibold transition-all group"
                                                >
                                                    <span className="text-sm">{link.title}</span>
                                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
