'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel'
import { ImageGalleryModal } from '@/components/ui/ImageGalleryModal'
import { Camera } from 'lucide-react'

// Fallback images if DB is empty
const DEFAULT_IMAGES = [
    '/setup-1.webp',
    '/setup-2.webp',
    '/setup-3.webp',
    '/setup-4.webp',
    '/setup-5.webp',
    '/setup-6.webp',
    '/setup-7.webp',
    '/setup-8.webp',
]

interface PhotoCollageSectionProps {
    initialSettings?: Record<string, string>
}

export function PhotoCollageSection({ initialSettings }: PhotoCollageSectionProps) {
    const [images, setImages] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [api, setApi] = useState<CarouselApi>()
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const res = await fetch('/api/photo-collage')
                if (res.ok) {
                    const data = await res.json()
                    if (data.images && data.images.length > 0) {
                        setImages(data.images.map((img: any) => img.imageUrl))
                    } else {
                        setImages(DEFAULT_IMAGES)
                    }
                } else {
                    setImages(DEFAULT_IMAGES)
                }
            } catch (error) {
                console.error('Failed to fetch collage images:', error)
                setImages(DEFAULT_IMAGES)
            } finally {
                setLoading(false)
            }
        }
        fetchImages()
    }, [])

    // Smooth Auto-scroll logic (every 3 seconds)
    useEffect(() => {
        if (!api) return

        const autoScroll = setInterval(() => {
            api.scrollNext()
        }, 3000)

        // Reset auto-scroll if user interacts
        api.on("select", () => {
            clearInterval(autoScroll)
        })

        return () => clearInterval(autoScroll)
    }, [api])

    if (loading) return <div className="py-20 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
    if (images.length === 0) return null

    return (
        <section className="py-20 bg-background overflow-hidden relative">
            <div className="container mx-auto px-4 mb-10 text-center">
                <h2 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 text-primary tracking-tight">
                    <Camera className="h-8 w-8" />
                    PREMIUM SETUPS
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Real workstation setups delivered to your villa, hotel, or coworking space in Bali.
                    Explore how our premium gear looks in the wild.
                </p>
            </div>

            {/* Seamless Infinite Carousel */}
            <div className="w-full relative px-4 md:px-0">
                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "center",
                        loop: true,
                        dragFree: true,
                        speed: 10, // Smooth ease transition
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4 flex items-center">
                        {images.map((src, index) => (
                            <CarouselItem
                                key={index}
                                // User requested width 70%. We use basis-[75%] on mobile, basis-[60%] on desktop to keep it wide and aesthetic
                                className="pl-4 basis-[85%] md:basis-[70%] lg:basis-[60%] cursor-pointer group"
                                onClick={() => {
                                    setSelectedIndex(index)
                                    setIsGalleryOpen(true)
                                }}
                            >
                                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl border border-primary/10">
                                    <Image
                                        src={src}
                                        alt={`Workstation Setup ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 85vw, 60vw"
                                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                        onError={(e: any) => {
                                            // Fallback if image path is broken
                                            e.target.src = '/LogoTropicTech.webp'
                                        }}
                                    />
                                    {/* Subtle overlay hash pattern / gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>

            <ImageGalleryModal
                isOpen={isGalleryOpen}
                initialIndex={selectedIndex}
                onClose={() => setIsGalleryOpen(false)}
                images={images}
            />
        </section>
    )
}
