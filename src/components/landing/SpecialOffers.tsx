'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { SharePopover } from './SharePopover'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Tag } from 'lucide-react'
import { ImageGalleryModal } from '@/components/ui/ImageGalleryModal'

interface SpecialOffersProps {
    initialSettings?: Record<string, string>
}

export default function SpecialOffers({ initialSettings }: SpecialOffersProps) {
    const [offers, setOffers] = useState<any[]>([])
    const { addItem } = useCart()
    const router = useRouter()
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        fetchSpecialOffers()
    }, [])

    const fetchSpecialOffers = async () => {
        try {
            const res = await fetch('/api/special-offers')
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.offers) {
                    // Limited to top 3 active offers to match instructions
                    setOffers(data.offers.slice(0, 3))
                }
            }
        } catch (error) {
            console.error('Failed to fetch special offers:', error)
        }
    }

    useEffect(() => {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api, offers])

    if (offers.length === 0) return null

    return (
        <section id="special-offers" className="py-16 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 text-primary text-balance max-w-4xl mx-auto">
                        <Tag className="h-8 w-8" />
                        {initialSettings?.special_offers_title?.toUpperCase() || "SPECIAL OFFERS"}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-balance">
                        {initialSettings?.special_offers_description || "Exclusive limited-time promotions on our premium workstation setups. Grab these deals while they last!"}
                    </p>
                </div>

                <div className="relative w-full max-w-6xl mx-auto px-12 mt-8">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "center",
                            loop: false,
                            dragFree: true,
                            containScroll: "trimSnaps",
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2 md:-ml-4">
                            {offers.map((offer) => (
                                <CarouselItem
                                    key={offer.id}
                                    className={`pl-2 md:pl-4 basis-[92%] sm:basis-[60%] md:basis-[50%] lg:basis-[40%] xl:basis-[35%] max-w-2xl ${offers.length === 1 ? 'mx-auto' : ''}`}
                                >
                                    <div className="h-full pt-4 pb-8">
                                        <div
                                            className="group relative flex flex-col justify-between h-full bg-card rounded-xl border-2 border-primary/20 shadow-xl overflow-hidden hover:border-primary transition-colors cursor-pointer text-center"
                                            onClick={() => {
                                                setSelectedOffer(offer)
                                                setIsGalleryOpen(true)
                                            }}
                                        >
                                            {offer.badgeText && (
                                                <div className="absolute top-4 left-4 z-10">
                                                    <Badge className="bg-destructive hover:bg-destructive shadow-lg text-xs font-black px-3 py-1">
                                                        {offer.badgeText}
                                                    </Badge>
                                                </div>
                                            )}

                                            <div className="relative aspect-video w-full bg-muted overflow-hidden">
                                                {offer.images && offer.images.length > 0 ? (
                                                    <Image
                                                        src={offer.images[0]}
                                                        alt={`${offer.title} - Special Offer | Tropic Tech Bali Workstation Rental`}
                                                        fill
                                                        loading="lazy"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                                                        <Tag className="h-12 w-12 opacity-20" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-primary/10 flex flex-col items-center">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground line-through">
                                                        Rp {offer.originalPrice.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-lg font-black text-primary leading-none mt-1">
                                                        Rp {offer.finalPrice.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1 items-center text-center">
                                                <div className="flex flex-col flex-1 w-full items-center">
                                                    <h3 className="text-2xl font-bold mb-2 leading-tight">{offer.title}</h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                                                        {offer.description}
                                                    </p>

                                                    {/* Simulated items list rendering for dummy data demonstration */}
                                                    <div className="w-full text-left bg-muted p-4 rounded-xl border border-primary/10 mb-6 flex-grow shadow-inner">
                                                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 text-center">Included setup</p>
                                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                                            {offer.title.includes("Nyepi") || offer.description.includes("Desk") ? (
                                                                <>
                                                                    <li className="flex items-center gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                                                        <span className="line-clamp-1">Herman Miller Aeron Chair x1</span>
                                                                    </li>
                                                                    <li className="flex items-center gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                                                        <span className="line-clamp-1">32-inch 4K Dell UltraSharp x1</span>
                                                                    </li>
                                                                    <li className="flex items-center gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                                                        <span className="line-clamp-1">Adjustable Standing Desk x1</span>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <li className="text-muted-foreground italic text-center text-xs">Custom premium bundle</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mt-auto w-full pt-4">
                                                        <Button
                                                            variant="default"
                                                            className="w-full font-bold shadow-md z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                addItem({
                                                                    id: offer.id,
                                                                    name: offer.title,
                                                                    price: offer.finalPrice,
                                                                    type: 'PACKAGE',
                                                                    image: offer.images?.[0] || '/LogoTropicTech.webp',
                                                                    duration: 30
                                                                })
                                                                router.push('/checkout')
                                                            }}
                                                        >
                                                            Claim Deal
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full flex justify-center items-center z-10 font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                router.push(`/product/${offer.id}`)
                                                            }}
                                                        >
                                                            Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {/* Pagination Dots */}
                        {isMounted && count > 0 && (
                            <div className="flex justify-center gap-2 mt-4 md:hidden">
                                {Array.from({ length: count }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            current === i ? "bg-primary w-4" : "bg-primary/20"
                                        )}
                                        onClick={() => api?.scrollTo(i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                        {offers.length > 3 && (
                            <>
                                <CarouselPrevious className="absolute -left-4 md:-left-12 lg:-left-16 h-12 w-12 border-2 border-primary/20 bg-background/80 hover:bg-background text-primary shadow-lg" />
                                <CarouselNext className="absolute -right-4 md:-right-12 lg:-right-16 h-12 w-12 border-2 border-primary/20 bg-background/80 hover:bg-background text-primary shadow-lg" />
                            </>
                        )}
                    </Carousel>
                </div>
            </div>

            <ImageGalleryModal
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                images={selectedOffer?.images?.length > 0 ? selectedOffer.images : ['/LogoTropicTech.webp']}
            />
        </section>
    )
}
