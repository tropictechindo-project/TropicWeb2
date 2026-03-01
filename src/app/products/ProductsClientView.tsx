'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Share2, ShoppingCart, Info, Search, Printer, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface CatalogItem {
    id: string
    name: string
    description: string
    imageUrl: string
    price: number
    discountPercentage: number
    category: string
    type: 'PRODUCT' | 'PACKAGE' | 'OFFER'
}

interface ProductsClientViewProps {
    products: CatalogItem[]
    packages: CatalogItem[]
    offers: CatalogItem[]
    categories: string[]
    catalogUrl?: string
    heroSubtitle?: string
    heroSubtitle2?: string
}

export function ProductsClientView({ products, packages, offers, categories, catalogUrl, heroSubtitle, heroSubtitle2 }: ProductsClientViewProps) {
    const { t } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<string>('All')
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

    const allItems = [...offers, ...packages, ...products]

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())

        if (activeTab === 'All') return matchesSearch
        if (activeTab === 'Special Offers') return matchesSearch && item.type === 'OFFER'
        if (activeTab === 'Packages') return matchesSearch && item.type === 'PACKAGE'
        return matchesSearch && item.category === activeTab
    })

    const tabs = ['All', 'Special Offers', 'Packages', ...categories]

    const handleShare = async (item: CatalogItem) => {
        const url = `${window.location.origin}/${item.type === 'PRODUCT' ? 'product' : item.type === 'PACKAGE' ? 'package' : 'offer'}/${item.id}`
        try {
            if (navigator.share) {
                await navigator.share({
                    title: item.name,
                    text: `Check out ${item.name} on Tropic Tech!`,
                    url: url,
                })
            } else {
                await navigator.clipboard.writeText(url)
                toast.success('Link copied to clipboard!')
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                await navigator.clipboard.writeText(url)
                toast.success('Link copied to clipboard!')
            }
        }
    }

    const handleSharePage = async () => {
        const url = window.location.href
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Tropic Tech Product Catalog',
                    text: 'Explore high-performance workstations and office rentals in Bali.',
                    url: url,
                })
            } else {
                await navigator.clipboard.writeText(url)
                toast.success('Page link copied to clipboard!')
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                await navigator.clipboard.writeText(url)
                toast.success('Page link copied to clipboard!')
            }
        }
    }

    const handlePrint = async () => {
        setIsGeneratingPdf(true)
        const toastId = toast.loading('Preparing high-resolution catalog items...')

        try {
            // Wait for images to load with a 5-second timeout
            const images = Array.from(document.querySelectorAll('.catalog-grid img')) as HTMLImageElement[]

            const imageLoadPromise = Promise.all(
                images.map((img) => {
                    if (img.complete) return Promise.resolve()
                    return new Promise((resolve) => {
                        img.onload = resolve
                        img.onerror = resolve
                    })
                })
            )

            // Race against a 5 second timeout - better to print with some missing images than hang forever
            await Promise.race([
                imageLoadPromise,
                new Promise(resolve => setTimeout(resolve, 5000))
            ])

            // Short delay to ensure layout stabilizer
            await new Promise(resolve => setTimeout(resolve, 800))

            toast.success('Catalog ready for download!', { id: toastId })
            window.print()
        } catch (error) {
            console.error('PDF Preparation Error:', error)
            toast.error('Failed to prepare catalog. Please try again.', { id: toastId })
        } finally {
            setIsGeneratingPdf(false)
        }
    }

    return (
        <div className="py-24 bg-muted/20 min-h-screen">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Advanced Brochure Header */}
                <div className="text-center mb-16 space-y-6 no-print">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                        Our Complete Catalog
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        High-performance workstations, ergonomic furniture, and complete office bundles ready for deployment anywhere in Bali.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 no-print">
                        {catalogUrl && (
                            <Button size="lg" className="rounded-full shadow-lg font-bold px-8 bg-blue-600 hover:bg-blue-700" asChild>
                                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-5 w-5" />
                                    Download PDF Catalog
                                </a>
                            </Button>
                        )}
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full shadow-md font-bold px-8 border-primary/20 disabled:opacity-50"
                            onClick={handlePrint}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Preparing PDF...
                                </>
                            ) : (
                                <>
                                    <Printer className="mr-2 h-5 w-5" />
                                    Download Brochure
                                </>
                            )}
                        </Button>
                        <Button size="lg" variant="ghost" className="rounded-full font-bold px-8 text-primary hover:bg-primary/5" onClick={handleSharePage}>
                            <Share2 className="mr-2 h-5 w-5" />
                            Share Catalog
                        </Button>

                        <div className="relative w-full sm:w-auto mt-4 sm:mt-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                className="pl-10 h-12 rounded-full w-full sm:w-80 shadow-sm bg-background border-primary/20 focus-visible:ring-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Print Styles */}
                <style jsx global>{`
                    @page {
                        size: A3 landscape;
                        margin: 5mm; /* Reduced margin for maximum coverage */
                    }
                    @media print {
                        .no-print, 
                        header, 
                        footer, 
                        nav,
                        .category-nav,
                        .action-bar,
                        button:not(.print-only) {
                            display: none !important;
                        }
                        .print-only {
                            display: block !important;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                            font-size: 7.5pt !important;
                            font-family: 'Inter', sans-serif !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .container {
                            max-width: 100% !important;
                            width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .bg-muted\/20 {
                            background-color: white !important;
                        }
                        .grid {
                            display: grid !important;
                            grid-template-columns: repeat(8, 1fr) !important; /* ULTRA DENSITY: 8 columns */
                            gap: 6px !important;
                        }
                        .card {
                            break-inside: avoid;
                            border: 0.2px solid #e2e8f0 !important;
                            box-shadow: none !important;
                            padding: 4px !important;
                            border-radius: 4px !important;
                            height: 100% !important;
                            display: flex !important;
                            flex-direction: column !important;
                        }
                        .card-image-container {
                            height: 70px !important; /* Micro images */
                            padding: 2px !important;
                            margin-bottom: 2px !important;
                        }
                        .card img {
                            height: 100% !important;
                            object-fit: contain !important;
                        }
                        h3 {
                            font-size: 7pt !important;
                            font-weight: 800 !important;
                            margin-bottom: 1px !important;
                            color: #0f172a !important;
                            line-height: 1.1 !important;
                        }
                        p.description {
                            font-size: 6pt !important;
                            color: #64748b !important;
                            line-height: 1 !important;
                            margin-bottom: 2px !important;
                            display: -webkit-box !important;
                            -webkit-line-clamp: 2 !important;
                            -webkit-box-orient: vertical !important;
                            overflow: hidden !important;
                        }
                        .price-block {
                            padding-top: 2px !important;
                            margin-top: auto !important;
                            border-top: 0.2px solid #f1f5f9 !important;
                        }
                        .price-total {
                            font-size: 8pt !important;
                            font-weight: 900 !important;
                            color: #2563eb !important;
                        }
                        .print-header {
                            margin-top: 0 !important;
                            padding-top: 5mm !important;
                        }
                        .catalog-main-title {
                            font-size: 14pt !important;
                            font-weight: 900 !important;
                        }
                        .contact-item {
                            font-size: 6pt !important;
                        }
                    }
                `}</style>

                {/* Print-Only Professional Header */}
                <div className="hidden print-only mb-6 print-header">
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center gap-4">
                            <Image
                                src="/LogoTropicTech.webp"
                                alt="Logo"
                                width={120}
                                height={40}
                                className="object-contain"
                            />
                            <div>
                                <h1 className="catalog-main-title tracking-tight text-slate-900">PT TROPIC TECH INTERNATIONAL</h1>
                                <div className="space-y-0.5 mt-1">
                                    <p className="font-black text-[7pt] text-blue-600 uppercase tracking-widest">{heroSubtitle || 'Workstation Rental Company'}</p>
                                    <p className="text-[6.5pt] text-slate-600 font-medium">{heroSubtitle2 || 'Premium monitors, ergonomic desks, and accessories - delivered same day in Bali.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right space-y-0.5 text-slate-500 text-[6pt]">
                            <p className="font-bold text-slate-900 text-[7pt]">OPERATIONAL HQ</p>
                            <p>Jl. Tunjungsari No.8, Padangsambian Kaja,</p>
                            <p>Denpasar Barat, Bali 80117, Indonesia</p>
                            <p className="font-black text-blue-600 mt-1">www.tropictech.online</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-center border-b border-slate-100 pb-3">
                        <div className="flex flex-col">
                            <span className="text-[5pt] text-slate-400 uppercase font-black tracking-tighter">Email Support</span>
                            <span className="font-bold text-slate-800 contact-item">contact@tropictech.online</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[5pt] text-slate-400 uppercase font-black tracking-tighter">Fast WhatsApp</span>
                            <span className="font-bold text-slate-800 contact-item">+62 822 6657 4860</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[5pt] text-slate-400 uppercase font-black tracking-tighter">Web Portal</span>
                            <span className="font-bold text-slate-800 contact-item">tropictech.online</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[5pt] text-slate-400 uppercase font-black tracking-tighter">Catalog Version</span>
                            <span className="font-bold text-slate-800 contact-item">April 2026 Edition</span>
                        </div>
                    </div>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-12 category-nav no-print">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab
                                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                : 'bg-background hover:bg-primary/10 text-muted-foreground hover:text-foreground shadow-sm'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Unified Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 catalog-grid">
                    {filteredItems.map(item => {
                        const originalPrice = item.price
                        const discountedPrice = item.discountPercentage > 0
                            ? originalPrice * (1 - item.discountPercentage / 100)
                            : originalPrice

                        const itemLink = `/${item.type === 'PRODUCT' ? 'product' : item.type === 'PACKAGE' ? 'package' : 'offer'}/${item.id}`

                        return (
                            <Card key={item.id} className="group overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 border-primary/10 bg-card rounded-2xl h-full">
                                {/* Image Box */}
                                <div className="relative aspect-square overflow-hidden bg-muted p-6 card-image-container">
                                    {item.discountPercentage > 0 && (
                                        <Badge className="absolute top-4 left-4 z-10 bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 shadow-lg badge no-print">
                                            -{item.discountPercentage}% OFF
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm border-primary/20 font-semibold shadow-sm badge no-print">
                                        {item.category}
                                    </Badge>

                                    <Link href={itemLink} className="block w-full h-full no-print">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-xl"
                                        />
                                    </Link>
                                    <div className="hidden print-only relative w-full h-full">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>

                                {/* Content Box */}
                                <CardContent className="flex-1 flex flex-col p-6 space-y-4">
                                    <div className="flex-1">
                                        <Link href={itemLink} className="no-print">
                                            <h3 className="font-bold text-xl line-clamp-2 hover:text-primary transition-colors leading-tight mb-2">
                                                {item.name}
                                            </h3>
                                        </Link>
                                        <h3 className="hidden print-only font-bold leading-tight mb-1">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 description">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Pricing Layout - Total Focus */}
                                    <div className="pt-4 border-t border-border/50 price-block">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 no-print">Total Price</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-primary price-total">
                                                Rp {discountedPrice.toLocaleString('id-ID')}
                                            </span>
                                            {item.discountPercentage > 0 && (
                                                <span className="text-sm line-through text-muted-foreground font-medium no-print">
                                                    Rp {originalPrice.toLocaleString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Action Bar */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 no-print">
                                        <Button asChild className="w-full font-bold shadow-md hover:shadow-lg transition-all" variant="default">
                                            <Link href={itemLink}>
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                Order Now
                                            </Link>
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="icon" className="w-full flex-1 border-primary/20 hover:bg-primary/5 text-primary" onClick={() => handleShare(item)} title="Share Product">
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="w-full flex-1 border-primary/20 hover:bg-primary/5 text-primary" asChild title="View Details">
                                                <Link href={itemLink}>
                                                    <Info className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-20 px-4 bg-card rounded-2xl border border-dashed border-primary/20 w-full max-w-2xl mx-auto shadow-sm">
                        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">No Matching Items</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setActiveTab('All') }} className="mt-4 font-bold text-primary">Clear all filters</Button>
                    </div>
                )}
                {/* Print-Only Professional Footer */}
                <div className="hidden print-only mt-10 pt-8 border-t-2 border-slate-100">
                    <div className="flex justify-between items-center text-slate-500 text-xs">
                        <div className="flex gap-8">
                            <p>© 2026 PT Tropic Tech International. All rights reserved.</p>
                            <p>Prices are subject to rental duration and availability.</p>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                            <LinkIcon className="h-3 w-3" />
                            <span>Access full digital catalog: www.tropictech.online/products</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
