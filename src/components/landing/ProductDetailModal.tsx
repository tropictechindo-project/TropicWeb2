'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Share2, Ruler, Palette, Star } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { toast } from 'sonner'
import { SharePopover } from './SharePopover'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { ImageGalleryModal } from '@/components/ui/ImageGalleryModal'

interface ProductDetailModalProps {
    isOpen: boolean
    onClose: () => void
    product: {
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
        stock?: number
        variants?: Array<{
            id: string
            color: string
            sku: string
            monthlyPrice: number
            stock: number
        }>
        items?: Array<{
            id: string
            name?: string
            quantity: number
            product?: { name: string }
        }>
    }
}

export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
    const router = useRouter()
    const { addItem } = useCart()
    const { t } = useLanguage()
    const [isAdded, setIsAdded] = useState(false)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId)

    // Normalize data
    const price = selectedVariant?.monthlyPrice || product.monthlyPrice || product.monthly_price || product.price || 0
    const images = (product.images && product.images.length > 0)
        ? product.images
        : [product.imageUrl || product.image_url || '/MyAi.webp']

    const displayImages = images.length > 0 ? images : ['/MyAi.webp']
    const currentStock = selectedVariant ? selectedVariant.stock : (product.stock !== undefined ? product.stock : 999)
    const isOutOfStock = currentStock === 0
    const needsSelection = (product.variants && product.variants.length > 0 && product.variants[0].color !== 'STANDARD') && !selectedVariant

    const handleAddToCart = () => {
        if (needsSelection) {
            toast.error('Please select a color first')
            return
        }
        addItem({
            id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
            name: selectedVariant && selectedVariant.color !== 'STANDARD'
                ? `${product.name} (${selectedVariant.color})`
                : product.name,
            price: price,
            type: product.category ? 'PRODUCT' : 'PACKAGE',
            image: displayImages[0],
            duration: 30,
            stock: currentStock,
            quantity: 1
        })
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
        toast.success(`${product.name} added to cart`)
    }

    const handleRentNow = () => {
        if (needsSelection) {
            toast.error('Please select a color first')
            return
        }
        addItem({
            id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
            name: selectedVariant && selectedVariant.color !== 'STANDARD'
                ? `${product.name} (${selectedVariant.color})`
                : product.name,
            price: price,
            type: product.category ? 'PRODUCT' : 'PACKAGE',
            image: displayImages[0],
            duration: 30,
            stock: currentStock,
            quantity: 1
        })
        router.push('/checkout')
    }


    const specs = product.specs as any
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)

    const openLightbox = (index: number) => {
        setLightboxIndex(index)
        setIsLightboxOpen(true)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground">
                            {product.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div className="relative">
                            <Carousel className="w-full max-w-sm mx-auto">
                                <CarouselContent>
                                    {displayImages.map((img, index) => (
                                        <CarouselItem key={index}>
                                            <div
                                                className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted cursor-zoom-in"
                                                onClick={() => openLightbox(index)}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${product.name} - View ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {displayImages.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-2" />
                                        <CarouselNext className="right-2" />
                                    </>
                                )}
                            </Carousel>
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Click image to enlarge
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-lg font-semibold text-primary">
                                    Rp {price.toLocaleString('id-ID')} / month
                                </p>
                            </div>

                            {/* Variant Selector */}
                            {product.variants && product.variants.length > 0 && product.variants[0].color !== 'STANDARD' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => setSelectedVariantId(variant.id)}
                                                className={cn(
                                                    "px-3 py-1 text-sm border rounded-md transition-all font-semibold",
                                                    selectedVariantId === variant.id
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-muted-foreground/30 hover:border-primary",
                                                    variant.stock === 0 && "opacity-50 line-through cursor-not-allowed"
                                                )}
                                            >
                                                {variant.color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Indicator */}
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2 py-1 text-xs font-bold rounded-md",
                                    isOutOfStock
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-green-100 text-green-700"
                                )}>
                                    {isOutOfStock ? 'Out of Stock' : `${currentStock} Available`}
                                </span>
                            </div>

                            {/* Package Items section */}
                            {product.items && product.items.length > 0 && (
                                <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-primary rounded-full" />
                                        Included in this Package
                                    </h4>
                                    <div className="space-y-1.5">
                                        {product.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center text-sm bg-background p-2 px-3 rounded-lg border shadow-sm">
                                                <span className="font-medium text-xs">{item.name || item.product?.name}</span>
                                                <span className="text-primary font-black text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {specs && (
                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        Specifications
                                    </h4>

                                    {specs.features && Array.isArray(specs.features) && (
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Star className="h-4 w-4" /> <span>Features</span>
                                            </div>
                                            <ul className="list-disc pl-5">
                                                {specs.features.map((f: string, i: number) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {(specs.length || specs.width || specs.height || specs.dimensions) && (
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Ruler className="h-4 w-4" /> <span>Dimensions</span>
                                            </div>
                                            {specs.length && <p>Length: {specs.length}</p>}
                                            {specs.width && <p>Width: {specs.width}</p>}
                                            {specs.height && <p>Height: {specs.height}</p>}
                                            {specs.dimensions && <p>{specs.dimensions}</p>}
                                        </div>
                                    )}

                                    {(specs.seatedHeight || specs.standingHeight) && (
                                        <div className="text-sm space-y-1">
                                            {specs.seatedHeight && <p>Seated Position: {specs.seatedHeight}</p>}
                                            {specs.standingHeight && <p>Standing Position: {specs.standingHeight}</p>}
                                            {specs.maxLoad && <p>Maximum Load: {specs.maxLoad}</p>}
                                        </div>
                                    )}

                                    {specs.colours && Array.isArray(specs.colours) && (
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Palette className="h-4 w-4" /> <span>Colours</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {specs.colours.map((c: string) => (
                                                    <span key={c} className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={handleAddToCart}
                                        variant={isAdded ? "default" : "outline"}
                                        disabled={isOutOfStock || !!needsSelection}
                                        className={isAdded ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                    >
                                        {isAdded ? "Added" : "Add to Cart"}
                                    </Button>
                                    <Button
                                        onClick={handleRentNow}
                                        disabled={isOutOfStock || !!needsSelection}
                                    >
                                        {isOutOfStock ? 'Out of Stock' : (needsSelection ? 'Select Color' : 'Rent Now')}
                                    </Button>
                                </div>

                                <div className="w-full">
                                    <SharePopover
                                        title={product.name}
                                        text={product.description}
                                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.id}`}
                                    />
                                    <span className="text-xs text-muted-foreground ml-2">Share this item</span>
                                </div>

                                <Button variant="secondary" onClick={() => window.location.href = `/product/${product.id}`} className="w-full">
                                    Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ImageGalleryModal
                images={displayImages}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
            />
        </>
    )
}
