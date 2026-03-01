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

    // Categorization for Print
    const printCategories = [
        { id: 'offers', title: 'Special Offers', items: offers },
        { id: 'packages', title: 'Packages', items: packages },
        { id: 'desk', title: 'Desk', items: products.filter(p => p.category === 'Desk') },
        { id: 'chair', title: 'Chair', items: products.filter(p => p.category === 'Chair') },
        { id: 'monitor', title: 'Monitor', items: products.filter(p => p.category === 'Monitor') },
        { id: 'keyboard-mouse', title: 'Mouse And Keyboard', items: products.filter(p => ['Mouse And Keyboard', 'Keyboard', 'Mouse'].includes(p.category)) },
        { id: 'accessories', title: 'Accessories', items: products.filter(p => p.category === 'Accessories') },
        { id: 'other', title: 'Other', items: products.filter(p => !['Desk', 'Chair', 'Monitor', 'Mouse And Keyboard', 'Keyboard', 'Mouse', 'Accessories'].includes(p.category)) },
    ].filter(cat => cat.items.length > 0)

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

    const renderProductCard = (item: CatalogItem, isPrint = false) => {
        const originalPrice = item.price
        const discountedPrice = item.discountPercentage > 0
            ? originalPrice * (1 - item.discountPercentage / 100)
            : originalPrice

        const itemLink = `/${item.type === 'PRODUCT' ? 'product' : item.type === 'PACKAGE' ? 'package' : 'offer'}/${item.id}`

        return (
            <Card key={item.id} className={`group overflow-hidden flex flex-col transition-all duration-300 ${isPrint ? 'p-0 border-none' : 'hover:shadow-2xl border-primary/10 bg-card rounded-2xl h-full'}`}>
                {/* Image Box */}
                <div className={`relative aspect-square overflow-hidden bg-muted card-image-container ${isPrint ? 'p-0 mb-0.5' : 'p-6'}`}>
                    {item.discountPercentage > 0 && !isPrint && (
                        <Badge className="absolute top-4 left-4 z-10 bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 shadow-lg badge no-print">
                            -{item.discountPercentage}% OFF
                        </Badge>
                    )}
                    {!isPrint && (
                        <Badge variant="outline" className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm border-primary/20 font-semibold shadow-sm badge no-print">
                            {item.category}
                        </Badge>
                    )}

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

                {/* Content Box - Web Only */}
                {!isPrint && (
                    <div className="flex-1 flex flex-col p-6 space-y-4 no-print">
                        <div className="flex-1">
                            <Link href={itemLink} className="no-print">
                                <h3 className="font-bold text-xl line-clamp-2 hover:text-primary transition-colors leading-tight mb-2">
                                    {item.name}
                                </h3>
                            </Link>
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
                    </div>
                )}

                {/* Print-Only Content Box - TOTAL CTA REMOVAL */}
                {isPrint && (
                    <div className="hidden print-only flex-1 flex flex-col p-1 space-y-0.5">
                        <h3 className="font-bold leading-tight mb-0.5">{item.name}</h3>
                        <p className="text-[5.5pt] text-slate-500 line-clamp-2 description leading-tight">
                            {item.description}
                        </p>
                        <div className="pt-1.5 border-t border-slate-100 mt-auto price-block">
                            <span className="text-[8.5pt] font-black text-blue-800 price-total">
                                Rp {discountedPrice.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                )}
            </Card>
        )
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
                                    Download / Print
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
                        margin: 0 !important; /* Force zero margin to remove browser artifacts */
                    }
                    @media print {
                        .no-print, 
                        header, 
                        footer, 
                        nav,
                        .category-nav,
                        .action-bar,
                        [role="button"],
                        button,
                        [data-sonner-toast],
                        .sonner-toast,
                        [class*="toast"],
                        .loading-overlay,
                        .preparing-indicator,
                        .cta-area,
                        .spinner,
                        [class*="spinner"],
                        .lucide-loader2 {
                            display: none !important;
                            opacity: 0 !important;
                            visibility: hidden !important;
                            height: 0 !important;
                            width: 0 !important;
                        }
                        .print-only {
                            display: block !important;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                            font-size: 8pt !important;
                            font-family: 'Inter', sans-serif !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            line-height: 1.2 !important;
                        }
                        .catalog-container {
                            padding: 4mm 8mm !important; /* Replacement for @page margin */
                            margin: 0 !important;
                            width: 100% !important;
                            max-width: none !important;
                        }
                        .container {
                            max-width: 100% !important;
                            width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .grid {
                            display: grid !important;
                            grid-template-columns: repeat(6, 1fr) !important;
                            gap: 3mm !important; 
                            row-gap: 5mm !important; 
                            width: 100% !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            text-align: left !important;
                        }
                        .print-category-group {
                            break-inside: avoid-page !important;
                            page-break-inside: avoid !important;
                            margin-bottom: 8mm !important;
                            display: block !important;
                            width: 100% !important;
                        }
                        .category-header {
                            break-after: avoid !important;
                            page-break-after: avoid !important;
                        }
                        .card {
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                            border: 0.5px solid #e2e8f0 !important;
                            box-shadow: none !important;
                            padding: 3px !important; /* Ultra-compact padding */
                            border-radius: 4px !important;
                            height: auto !important;
                            min-height: 100px !important; /* Even lower */
                            display: flex !important;
                            flex-direction: column !important;
                            position: relative !important;
                            margin-bottom: 0 !important; /* Let grid gap handle it */
                        }
                        .card-image-container {
                            height: 65px !important; /* Slightly taller for zoom effect */
                            min-height: 65px !important;
                            padding: 0 !important;
                            margin-bottom: 2px !important;
                            background: white !important;
                            overflow: hidden !important;
                        }
                        .card img {
                            height: 115% !important; /* Zoom in effect */
                            width: 115% !important;
                            object-fit: contain !important;
                            position: relative !important;
                            left: -7.5% !important; /* Center the zoom */
                            top: -7.5% !important;
                        }
                        h3 {
                            font-size: 7.2pt !important; /* Planned 7.2pt */
                            font-weight: 800 !important;
                            margin-bottom: 1px !important;
                            color: #0f172a !important;
                            line-height: 1.05 !important;
                        }
                        p.description {
                            font-size: 5.5pt !important; /* Planned 5.5pt micro-text */
                            color: #475569 !important;
                            line-height: 1 !important;
                            margin-bottom: 3px !important;
                            display: -webkit-box !important;
                            -webkit-line-clamp: 2 !important;
                            -webkit-box-orient: vertical !important;
                            overflow: hidden !important;
                        }
                        .price-block {
                            padding-top: 3px !important;
                            margin-top: auto !important;
                            border-top: 0.5px solid #f1f5f9 !important;
                        }
                        .price-total {
                            font-size: 8.5pt !important; /* Planned 8.5pt */
                            font-weight: 900 !important;
                            color: #1e40af !important;
                        }
                        .print-header {
                            margin: 0 !important;
                            padding: 0 !important;
                            margin-top: 2mm !important; /* Move to absolute top with safety */
                            margin-bottom: 3mm !important;
                        }
                        .catalog-main-title {
                            font-size: 15pt !important;
                            font-weight: 950 !important;
                            letter-spacing: -0.05em !important;
                        }
                        .contact-item {
                            font-size: 7.5pt !important;
                            font-weight: 800 !important;
                            text-transform: none !important; /* Regular style */
                        }
                        .print-footer {
                            margin-top: 5mm !important;
                            border-top: 1px solid #e2e8f0 !important;
                            padding-top: 4mm !important;
                            width: 100% !important;
                        }
                    }
                `}</style>

                {/* Catalog Container for Zero-Margin Page Printing */}
                <div className="catalog-container">
                    {/* Ultra-Premium Centered Header */}
                    <div className="hidden print-only print-header">
                        <div className="flex flex-col items-center text-center border-b-[2px] border-slate-900 pb-3 w-full">
                            <h1 className="catalog-main-title tracking-tighter text-slate-950 leading-none">PT TROPIC TECH INTERNATIONAL</h1>
                            <div className="mt-2 text-center">
                                <p className="font-black text-[9.5pt] text-blue-700 tracking-[0.1em]">{heroSubtitle || 'Workstation Rental Company'}</p>
                                <p className="text-[8.5pt] text-slate-500 font-bold max-w-3xl mx-auto mt-0.5">{heroSubtitle2 || 'Premium monitors, ergonomic desks, and accessories - delivered same day in Bali.'}</p>
                            </div>
                        </div>

                        <div className="flex justify-center flex-wrap gap-x-16 gap-y-1.5 mt-3 text-center border-b border-slate-200 pb-3 w-full">
                            <div className="flex items-center gap-3">
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Email :</span>
                                <span className="font-black text-slate-950 contact-item">contact@tropictech.online</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Whatsapp :</span>
                                <span className="font-black text-slate-950 contact-item">+62 822 6657 4860</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Web :</span>
                                <span className="font-black text-slate-950 contact-item">www.tropictech.online</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Catalog :</span>
                                <span className="font-black text-slate-950 contact-item">Edition April 2026</span>
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

                    {/* Unified Product Grid - Web Version */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 catalog-grid no-print">
                        {filteredItems.map(item => renderProductCard(item))}
                    </div>

                    {/* Categorized Brochure - Print Version Only */}
                    <div className="hidden print-only space-y-8">
                        {printCategories.map(category => (
                            <div key={category.id} className="print-category-group">
                                <h2 className="text-lg font-black text-slate-900 border-b-2 border-slate-200 pb-1 uppercase tracking-wider category-header mb-4">
                                    {category.title}
                                </h2>
                                <div className="grid grid-cols-6 gap-3 catalog-grid">
                                    {category.items.map(item => renderProductCard(item, true))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 px-4 bg-card rounded-2xl border border-dashed border-primary/20 w-full max-w-2xl mx-auto shadow-sm">
                            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">No Matching Items</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                            <Button variant="link" onClick={() => { setSearchQuery(''); setActiveTab('All') }} className="mt-4 font-bold text-primary">Clear all filters</Button>
                        </div>
                    )}
                    {/* Print-Only Professional Footer - Perfectly Centered */}
                    <div className="hidden print-only print-footer">
                        <div className="flex flex-col items-center justify-center text-center">
                            <p className="text-slate-950 text-[9pt] font-black uppercase tracking-[0.1em]">PT Tropic Tech International</p>
                            <div className="flex justify-center gap-6 mt-1 text-slate-500 text-[7.5pt] font-bold">
                                <p>© 2026 All rights reserved.</p>
                                <p>Prices are subject to rental duration and availability.</p>
                            </div>
                            <p className="mt-2 font-black text-blue-700 text-[8.5pt] tracking-tight">
                                Access full digital catalog: www.tropictech.online/products
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Loading Overlay - Hidden in Print */}
                {isGeneratingPdf && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm no-print items-preparing">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 no-print">Preparing high-resolution catalog items...</h3>
                                <p className="text-slate-500 mt-1 no-print">This ensures all images look crisp in your brochure.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
