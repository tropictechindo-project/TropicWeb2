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
import { motion, AnimatePresence } from 'framer-motion'
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

    const renderProductCard = (item: CatalogItem, index: number, isPrint = false) => {
        const originalPrice = item.price
        const discountedPrice = item.discountPercentage > 0
            ? originalPrice * (1 - item.discountPercentage / 100)
            : originalPrice

        const itemLink = `/${item.type === 'PRODUCT' ? 'product' : item.type === 'PACKAGE' ? 'package' : 'offer'}/${item.id}`

        if (isPrint) {
            return (
                <Card key={item.id} className="p-0 border-none flex flex-col">
                    <div className="relative aspect-square overflow-hidden bg-muted p-0 mb-0.5">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 flex flex-col p-1 space-y-0.5">
                        <h3 className="font-bold leading-tight mb-0.5">{item.name}</h3>
                        <p className="text-[5.5pt] text-slate-500 line-clamp-2 leading-tight">{item.description}</p>
                        <div className="pt-1.5 border-t border-slate-100 mt-auto">
                            <span className="text-[8.5pt] font-black text-blue-800">Rp {discountedPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </Card>
            )
        }

        return (
            <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
            >
                <Card className="group relative overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl border-none bg-white dark:bg-zinc-900 rounded-[1.5rem] h-full no-print">

                    {/* Image Box - Optimized for Real Set-Up (Horizontal/Landscape friendly) */}
                    <div className="relative aspect-video overflow-hidden card-image-container">
                        {item.discountPercentage > 0 && (
                            <Badge className="absolute top-3 left-3 z-20 bg-red-600 text-white font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-sm">
                                -{item.discountPercentage}%
                            </Badge>
                        )}
                        <Badge variant="secondary" className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white border-transparent font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
                            {item.category}
                        </Badge>

                        <Link href={itemLink} className="block w-full h-full relative group/img">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            {/* Subtle Overlay */}
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
                        </Link>
                    </div>

                    {/* Content Box - Professional Minimalist */}
                    <div className="relative flex-1 flex flex-col p-4 sm:p-5 space-y-3">
                        <div className="flex-1 space-y-1">
                            <Link href={itemLink}>
                                <h3 className="font-bold text-base sm:text-lg line-clamp-1 hover:text-primary transition-colors tracking-tight leading-tight">
                                    {item.name}
                                </h3>
                            </Link>
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 font-medium leading-relaxed opacity-80">
                                {item.description}
                            </p>
                        </div>

                        {/* Pricing & CTA */}
                        <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Monthly Rent</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-black text-primary italic">
                                        Rp {(discountedPrice / 1000).toLocaleString('id-ID')}k
                                    </span>
                                    {item.discountPercentage > 0 && (
                                        <span className="text-[9px] line-through text-muted-foreground/50 font-bold">
                                            {Math.round(originalPrice / 1000)}k
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Button asChild size="sm" className="rounded-lg font-black uppercase tracking-widest text-[9px] h-9 px-4 shadow-lg shadow-primary/20" variant="default">
                                <Link href={itemLink}>
                                    Rent
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="py-24 bg-muted/20 min-h-screen">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Advanced Brochure Header */}
                <div className="text-center mb-16 space-y-8 no-print pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-block"
                    >
                        <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-full border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5 italic">
                            Official Workspace Catalog
                        </Badge>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none"
                    >
                        Real <span className="text-primary">Set-Up</span> Experience
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium"
                    >
                        Hardware tailored for the digital nomad. Rent high-end workstations with same-day Bali dispatch.
                    </motion.p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 no-print">
                        {catalogUrl && (
                            <Button size="lg" className="rounded-2xl shadow-2xl font-black uppercase tracking-widest text-[10px] px-8 bg-primary hover:scale-105 transition-transform" asChild>
                                <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Get PDF Catalog
                                </a>
                            </Button>
                        )}
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-2xl shadow-xl font-black uppercase tracking-widest text-[10px] px-8 border-white/20 backdrop-blur-md bg-white/5 hover:bg-white/10"
                            onClick={handlePrint}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Preparing...
                                </>
                            ) : (
                                <>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print View
                                </>
                            )}
                        </Button>
                        <Button size="lg" variant="ghost" className="rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 text-primary/80 hover:bg-primary/5" onClick={handleSharePage}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>

                        <div className="relative w-full sm:w-auto mt-4 sm:mt-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search inventory..."
                                className="pl-12 h-14 rounded-2xl w-full sm:w-80 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 focus-visible:ring-primary/50 font-medium text-sm"
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

                        <div className="flex justify-center flex-wrap mt-3 text-center border-b border-slate-200 pb-3 w-full">
                            <div className="inline-flex items-center" style={{ marginRight: '15pt' }}>
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Email :</span>
                                <span className="font-black text-slate-950 contact-item ml-1">contact@tropictech.online</span>
                            </div>
                            <div className="inline-flex items-center" style={{ marginRight: '15pt' }}>
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Whatsapp :</span>
                                <span className="font-black text-slate-950 contact-item ml-1">+62 822 6657 4860</span>
                            </div>
                            <div className="inline-flex items-center" style={{ marginRight: '15pt' }}>
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Web :</span>
                                <span className="font-black text-slate-950 contact-item ml-1">www.tropictech.online</span>
                            </div>
                            <div className="inline-flex items-center">
                                <span className="text-[6.5pt] text-slate-400 font-black tracking-wider">Catalog :</span>
                                <span className="font-black text-slate-950 contact-item ml-1">Edition April 2026</span>
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

                    {/* Unified Product Grid - Optimized for Landscape Phones */}
                    <AnimatePresence mode='popLayout'>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 catalog-grid no-print">
                            {filteredItems.map((item, idx) => renderProductCard(item, idx))}
                        </div>
                    </AnimatePresence>

                    {/* Categorized Brochure - Print Version Only */}
                    <div className="hidden print-only space-y-8">
                        {printCategories.map(category => (
                            <div key={category.id} className="print-category-group">
                                <h2 className="text-lg font-black text-slate-900 border-b-2 border-slate-200 pb-1 uppercase tracking-wider category-header mb-4">
                                    {category.title}
                                </h2>
                                <div className="grid grid-cols-6 gap-3 catalog-grid">
                                    {category.items.map((item, idx) => renderProductCard(item, idx, true))}
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
