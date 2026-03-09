'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Share2, Ruler, Palette, Star, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { SharePopover } from '@/components/landing/SharePopover'
import { ImageLightboxViewer } from '@/components/ui/ImageLightboxViewer'
import { Badge } from '@/components/ui/badge'

// Simple type definition based on what we expect
type Item = {
    id: string
    name: string
    description: string
    monthlyPrice?: number
    monthly_price?: number
    price?: number
    images?: string[]
    image_url?: string | null
    imageUrl?: string | null
    specs?: any
    category?: string
    items?: Array<{
        id: string
        name?: string
        quantity: number
        product?: { name: string }
    }>
}

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { addItem } = useCart()
    const { t } = useLanguage()
    const [item, setItem] = useState<Item | null>(null)
    const [loading, setLoading] = useState(true)
    const [displayImages, setDisplayImages] = useState<string[]>([])
    const [activeImage, setActiveImage] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)

    const REAL_VIEW_IMAGES = [
        '/Real-View-WebP/031f79baecbc42cf694bd9cd1d708411.webp',
        '/Real-View-WebP/04e4e2fa4c95f23017e79dc9be6007c4.webp',
        '/Real-View-WebP/0c6ba37f-0da2-4bb4-ba1f-39041ce23792.webp',
        '/Real-View-WebP/13e319869efd79d6115fc5687b213768.webp',
        '/Real-View-WebP/33aabf501484a286fe88624468fc4e50.webp',
        '/Real-View-WebP/58b745ef6fe2edd412edcc61f37ccdf3.webp',
        '/Real-View-WebP/59c00e92adaabfd1d301d1fa1ee0c933.webp',
        '/Real-View-WebP/6e111249bbfbd341a3ad30ab1fe0a5be.webp',
        '/Real-View-WebP/7bcdde95f664d6234d2dcb09151c4faa.webp',
        '/Real-View-WebP/7cc074cb90651f3321d1477d0d83051f.webp',
    ]

    const getRealViewImage = (id: string) => {
        let hash = 0
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i)
            hash |= 0
        }
        return REAL_VIEW_IMAGES[Math.abs(hash) % REAL_VIEW_IMAGES.length]
    }

    useEffect(() => {
        async function fetchItem() {
            if (!params?.id) {
                setLoading(false)
                return
            }

            try {
                // 1. Try fetching as Product
                let res = await fetch(`/api/products/${params.id}`)

                // 2. If not found or error, try fetching as Package
                if (!res.ok) {
                    const resPkg = await fetch(`/api/packages/${params.id}`)
                    if (resPkg.ok) {
                        res = resPkg
                    } else {
                        // 3. Try fetching as Special Offer
                        const resOffer = await fetch(`/api/special-offers/${params.id}`)
                        if (resOffer.ok) {
                            res = resOffer
                        }
                    }
                }

                if (res.ok) {
                    const data = await res.json()
                    const actualItem = data.product || data.package || data.offer
                    if (actualItem) {
                        // Mapping special offer properties for compatibility
                        const formattedItem = {
                            ...actualItem,
                            name: actualItem.name || actualItem.title,
                            monthlyPrice: actualItem.monthlyPrice || actualItem.price || actualItem.finalPrice,
                            description: actualItem.description,
                            category: data.offer ? null : actualItem.category, // Helps determine it's a package
                        }

                        setItem(formattedItem)

                        // Force use of Real View Images for consistency
                        const realImg = getRealViewImage(params.id as string)
                        setDisplayImages([realImg])
                    }
                }
            } catch (error) {
                console.error("Failed to fetch item", error)
            } finally {
                setLoading(false)
            }
        }
        fetchItem()
    }, [params?.id])

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>
    if (!item) return <div className="min-h-screen flex items-center justify-center bg-background">Item not found</div>

    // Specs handling
    const specs = item.specs || {}
    const price = item.monthlyPrice || item.monthly_price || item.price || 0


    const handleRentNow = () => {
        addItem({
            id: item.id,
            name: item.name,
            price: price,
            type: item.category ? 'PRODUCT' : 'PACKAGE',
            image: displayImages[0],
            duration: 30
        })
        router.push('/checkout')
    }

    return (
        <div className="min-h-screen bg-muted/20 pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button variant="ghost" className="rounded-xl font-bold hover:bg-white/50 dark:hover:bg-zinc-800/50" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                    </Button>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Images Section - Takes 7 columns on large screens */}
                    <div className="lg:col-span-7 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative aspect-video w-full rounded-[1.5rem] overflow-hidden bg-white dark:bg-zinc-900 border border-black/5 shadow-2xl cursor-pointer group active:scale-[0.99] transition-transform"
                            onClick={() => setLightboxOpen(true)}
                        >
                            <Image
                                src={displayImages[activeImage]}
                                alt={item.name || "Product Image"}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
                        </motion.div>

                        <AnimatePresence>
                            {displayImages.length > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                                >
                                    {displayImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={`relative w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-white dark:bg-zinc-900 snap-start ${activeImage === i ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <Image src={img} alt="thumbnail" fill className="object-cover" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <ImageLightboxViewer
                        images={displayImages}
                        initialIndex={activeImage}
                        open={lightboxOpen}
                        onOpenChange={setLightboxOpen}
                    />

                    {/* Details Section - Takes 5 columns */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-5 flex flex-col space-y-8"
                    >
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Badge variant="secondary" className="bg-primary/5 text-primary border-transparent font-black uppercase tracking-[0.2em] text-[8px] px-3 py-1 rounded-sm">
                                    {item.category || 'Special Bundle'}
                                </Badge>
                            </motion.div>

                            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic leading-none">{item.name}</h1>

                            <div className="flex items-center gap-4">
                                <div className="bg-primary/5 border border-primary/10 px-6 py-3 rounded-xl">
                                    <p className="text-2xl font-black text-primary italic tracking-tighter">
                                        Rp {price.toLocaleString('id-ID')}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/40">Monthly Equipment Fee</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-muted-foreground font-medium leading-relaxed">
                            <p className="line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
                                {item.description}
                            </p>
                        </div>

                        {/* Package Items section */}
                        {item.items && item.items.length > 0 && (
                            <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-2xl border border-primary/10 space-y-4">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                                    <div className="w-1 h-3 bg-primary" />
                                    Bundle Contents
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {item.items.map((pkgItem) => (
                                        <div key={pkgItem.id} className="flex justify-between items-center bg-white dark:bg-black/20 p-4 rounded-xl border border-black/5 shadow-sm">
                                            <span className="font-bold text-xs uppercase italic">{pkgItem.name || pkgItem.product?.name}</span>
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black px-3 rounded-sm">
                                                x{pkgItem.quantity}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Specs Section */}
                        {(specs.features || specs.dimensions || specs.colours) && (
                            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl space-y-8">
                                <h3 className="font-black text-sm uppercase tracking-[0.2em] italic">Technical Profile</h3>

                                {specs.features && Array.isArray(specs.features) && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Star className="h-4 w-4" /> <span className="font-black text-[10px] uppercase tracking-widest">Core Features</span>
                                        </div>
                                        <ul className="grid grid-cols-1 gap-3">
                                            {specs.features.map((f: string, i: number) => (
                                                <li key={i} className="flex items-center gap-3 text-xs font-bold leading-tight uppercase italic opacity-80">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-black/5 dark:border-white/5">
                                    {(specs.length || specs.width || specs.height || specs.dimensions) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Ruler className="h-4 w-4" /> <span className="font-black text-[10px] uppercase tracking-widest">Dimensions</span>
                                            </div>
                                            <div className="text-[10px] font-black space-y-1.5 text-muted-foreground uppercase italic">
                                                {specs.length && <p>Length: {specs.length}</p>}
                                                {specs.width && <p>Width: {specs.width}</p>}
                                                {specs.height && <p>Height: {specs.height}</p>}
                                                {specs.dimensions && <p className="normal-case font-medium">{specs.dimensions}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {specs.colours && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Palette className="h-4 w-4" /> <span className="font-black text-[10px] uppercase tracking-widest">Optics</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {specs.colours.map((c: string) => (
                                                    <span key={c} className="px-3 py-1.5 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-sm transition-all hover:scale-110">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-4 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button size="lg" className="h-14 text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
                                    addItem({
                                        id: item.id,
                                        name: item.name,
                                        price: price,
                                        type: item.category ? 'PRODUCT' : 'PACKAGE',
                                        image: displayImages[0],
                                        duration: 30
                                    })
                                    toast.success("Locked in Cart")
                                }}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                </Button>
                                <Button size="lg" variant="secondary" className="h-14 text-xs font-black uppercase tracking-widest rounded-2xl border border-black/10 dark:border-white/10 backdrop-blur-md shadow-xl hover:scale-[1.02] active:scale-[0.98]" onClick={handleRentNow}>
                                    Checkout Now
                                </Button>
                            </div>
                            <div className="w-full flex items-center justify-center sm:justify-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                                <SharePopover
                                    title={item.name}
                                    text={item.description}
                                    url={`${typeof window !== 'undefined' ? window.location.href : ''}`}
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Share Experience</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
