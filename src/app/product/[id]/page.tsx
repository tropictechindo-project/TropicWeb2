'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Share2, Ruler, Palette, Star, ArrowLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import { SharePopover } from '@/components/landing/SharePopover'

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
                    }
                }

                if (res.ok) {
                    const data = await res.json()
                    const actualItem = data.product || data.package
                    if (actualItem) {
                        setItem(actualItem)
                        const imgs = (actualItem.images && actualItem.images.length > 0)
                            ? actualItem.images
                            : [actualItem.imageUrl || actualItem.image_url || '/MyAi.webp']
                        setDisplayImages(imgs)
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
        <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted border">
                            <Image
                                src={displayImages[activeImage]}
                                alt={item.name || "Product Image"}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        {displayImages.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {displayImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <Image src={img} alt="thumbnail" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{item.name}</h1>
                            <p className="text-2xl text-primary font-bold">
                                Rp {price.toLocaleString('id-ID')} <span className="text-lg font-normal text-muted-foreground">/ month</span>
                            </p>
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                            <p>{item.description}</p>
                        </div>

                        {/* Specs Section */}
                        {(specs.features || specs.dimensions || specs.colours) && (
                            <div className="bg-muted/30 p-6 rounded-xl border space-y-6">
                                <h3 className="font-semibold text-lg">Specifications</h3>

                                {specs.features && Array.isArray(specs.features) && (
                                    <div>
                                        <div className="flex items-center gap-2 text-primary mb-3">
                                            <Star className="h-4 w-4" /> <span className="font-medium">Features</span>
                                        </div>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                            {specs.features.map((f: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    {(specs.length || specs.width || specs.height || specs.dimensions) && (
                                        <div>
                                            <div className="flex items-center gap-2 text-primary mb-2">
                                                <Ruler className="h-4 w-4" /> <span className="font-medium">Dimensions</span>
                                            </div>
                                            <div className="text-sm space-y-1 text-muted-foreground">
                                                {specs.length && <p>L: {specs.length}</p>}
                                                {specs.width && <p>W: {specs.width}</p>}
                                                {specs.height && <p>H: {specs.height}</p>}
                                                {specs.dimensions && <p>{specs.dimensions}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {specs.colours && (
                                        <div>
                                            <div className="flex items-center gap-2 text-primary mb-2">
                                                <Palette className="h-4 w-4" /> <span className="font-medium">Colours</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {specs.colours.map((c: string) => (
                                                    <span key={c} className="px-2 py-1 bg-background rounded-md text-xs font-medium border shadow-sm">
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
                        <div className="flex flex-col gap-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Button size="lg" className="h-12 text-lg" onClick={() => {
                                    addItem({
                                        id: item.id,
                                        name: item.name,
                                        price: price,
                                        type: item.category ? 'PRODUCT' : 'PACKAGE',
                                        image: displayImages[0],
                                        duration: 30
                                    })
                                    toast.success("Added to cart")
                                }}>
                                    Add to Cart
                                </Button>
                                <Button size="lg" variant="secondary" className="h-12 text-lg" onClick={handleRentNow}>
                                    Rent Now
                                </Button>
                            </div>
                            <div className="w-full flex items-center gap-3">
                                <SharePopover
                                    title={item.name}
                                    text={item.description}
                                    url={`${typeof window !== 'undefined' ? window.location.href : ''}`}
                                />
                                <span className="text-sm text-muted-foreground font-medium">Share this item</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
