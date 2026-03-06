'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const setupImages = [
    '/Set-Up/setup1.webp',
    '/Set-Up/setup2.webp',
    '/Set-Up/setup3.webp',
    '/Set-Up/setup4.webp',
    '/Set-Up/setup5.webp',
    '/Set-Up/setup6.webp',
    '/Set-Up/setup7.webp',
    '/Set-Up/setup8.webp',
]

export default function RealSetupGallery() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    const nextImage = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % setupImages.length)
    }, [])

    const prevImage = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + setupImages.length) % setupImages.length)
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isOpen && isAutoPlaying) {
            interval = setInterval(nextImage, 2000)
        }
        return () => clearInterval(interval)
    }, [isOpen, isAutoPlaying, nextImage])

    // Click on right/left side logic
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        if (x > rect.width / 2) {
            nextImage()
        } else {
            prevImage()
        }
        setIsAutoPlaying(false) // Pause on manual interaction
    }

    return (
        <section className="py-24 bg-muted/10 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">Real Set-up View</h2>
                        <p className="text-muted-foreground text-lg italic">"Exactly what we deliver. No stock photos, just premium Bali workstations."</p>
                    </div>

                    <Button
                        size="lg"
                        onClick={() => setIsOpen(true)}
                        className="h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        <Maximize2 className="mr-3 w-5 h-5" /> SEE ALL SET-UP
                    </Button>
                </div>

                {/* Featured Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70 group hover:opacity-100 transition-opacity">
                    {setupImages.slice(0, 4).map((img, i) => (
                        <div key={i} className="aspect-[4/3] relative rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer" onClick={() => { setCurrentIndex(i); setIsOpen(true); }}>
                            <Image src={img} alt="Setup preview" fill className="object-cover" sizes="25vw" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Cinematic Lightbox */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative w-full max-w-7xl h-full md:aspect-video flex items-center justify-center overflow-hidden cursor-pointer group/modal"
                        onClick={(e) => { e.stopPropagation(); handleImageClick(e); }}
                    >
                        <Image
                            src={setupImages[currentIndex]}
                            alt="Real setup view"
                            fill
                            className="object-contain md:object-cover select-none pointer-events-none"
                            priority
                            quality={100}
                        />

                        {/* Cinematic Overlay - Dark edges */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 opacity-0 group-hover/modal:opacity-100 transition-opacity" />

                        {/* Navigation Overlay Hints */}
                        <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-8 opacity-0 group-hover/modal:opacity-100 transition-opacity">
                            <ChevronLeft className="w-12 h-12 text-white/50" />
                        </div>
                        <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-8 opacity-0 group-hover/modal:opacity-100 transition-opacity">
                            <ChevronRight className="w-12 h-12 text-white/50" />
                        </div>

                        {/* HUD / UI */}
                        <div className="absolute top-8 right-8 flex gap-4 z-50">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); }}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white"
                            >
                                <Play className={cn("w-6 h-6", isAutoPlaying && "fill-current")} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                            {setupImages.map((_, i) => (
                                <div key={i} className={cn("h-1 w-8 rounded-full transition-all duration-300", i === currentIndex ? "bg-primary w-12" : "bg-white/20")} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
