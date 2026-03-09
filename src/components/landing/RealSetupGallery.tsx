'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const DEFAULT_SETUP_IMAGES = [
    "/Real-View-WebP/031f79baecbc42cf694bd9cd1d708411.webp",
    "/Real-View-WebP/04e4e2fa4c95f23017e79dc9be6007c4.webp",
    "/Real-View-WebP/0c6ba37f-0da2-4bb4-ba1f-39041ce23792.webp",
    "/Real-View-WebP/1257fd47bd2f09e2715fad05b03f71fc.webp",
    "/Real-View-WebP/13e319869efd79d6115fc5687b213768.webp",
    "/Real-View-WebP/2351a099f4938a7014509e1453cbd573.webp",
    "/Real-View-WebP/2475c27d3d4d6328f127d1d2fe7db449.webp",
    "/Real-View-WebP/33aabf501484a286fe88624468fc4e50.webp",
    "/Real-View-WebP/58b745ef6fe2edd412edcc61f37ccdf3.webp",
    "/Real-View-WebP/59c00e92adaabfd1d301d1fa1ee0c933.webp",
    "/Real-View-WebP/6e111249bbfbd341a3ad30ab1fe0a5be.webp",
    "/Real-View-WebP/7bcdde95f664d6234d2dcb09151c4faa.webp",
    "/Real-View-WebP/7cc074cb90651f3321d1477d0d83051f.webp",
    "/Real-View-WebP/83e2a406df15f12b6de64b847661d492.webp",
    "/Real-View-WebP/883e28bea9cb1a252d0b230e4ca90f07.webp",
    "/Real-View-WebP/88c266374ca675757244aec0a1ed33b2.webp",
    "/Real-View-WebP/IMG_5683.webp",
    "/Real-View-WebP/IMG_5776.webp",
    "/Real-View-WebP/IMG_5780.webp",
    "/Real-View-WebP/IMG_5796.webp",
    "/Real-View-WebP/IMG_5807.webp",
    "/Real-View-WebP/IMG_5918.webp",
    "/Real-View-WebP/IMG_5920.webp",
    "/Real-View-WebP/IMG_5923.webp",
    "/Real-View-WebP/IMG_5936.webp",
    "/Real-View-WebP/IMG_6059.webp",
    "/Real-View-WebP/IMG_6139.webp",
    "/Real-View-WebP/IMG_6140.webp",
    "/Real-View-WebP/IMG_6255.webp",
    "/Real-View-WebP/IMG_6308.webp",
    "/Real-View-WebP/IMG_6352.webp",
    "/Real-View-WebP/IMG_6604.webp",
    "/Real-View-WebP/IMG_6659.webp",
    "/Real-View-WebP/IMG_6703.webp",
    "/Real-View-WebP/IMG_6839.webp",
    "/Real-View-WebP/IMG_6893.webp",
    "/Real-View-WebP/IMG_7032.webp",
    "/Real-View-WebP/IMG_7108.webp",
    "/Real-View-WebP/IMG_7224.webp",
    "/Real-View-WebP/IMG_7230.webp",
    "/Real-View-WebP/IMG_7273.webp",
    "/Real-View-WebP/IMG_7334.webp",
    "/Real-View-WebP/IMG_7335.webp",
    "/Real-View-WebP/IMG_7341.webp",
    "/Real-View-WebP/IMG_7427.webp",
    "/Real-View-WebP/IMG_7470.webp",
    "/Real-View-WebP/IMG_7520.webp",
    "/Real-View-WebP/IMG_7585.webp",
    "/Real-View-WebP/IMG_7608.webp",
    "/Real-View-WebP/IMG_7609.webp",
    "/Real-View-WebP/IMG_7734.webp",
    "/Real-View-WebP/IMG_7806.webp",
    "/Real-View-WebP/IMG_7897.webp",
    "/Real-View-WebP/IMG_8004.webp",
    "/Real-View-WebP/IMG_8045.webp",
    "/Real-View-WebP/IMG_8102.webp",
    "/Real-View-WebP/TC_00003.webp",
    "/Real-View-WebP/a50e56c1c464df1096d1a5d4f90a25e7.webp",
    "/Real-View-WebP/a532c0bac0dd3e96f137b261622b9673.webp",
    "/Real-View-WebP/aaf296bb29de9c87939cd373582ff707.webp",
    "/Real-View-WebP/b35bb8125f8d2cc59a0a255f5e104889.webp",
    "/Real-View-WebP/bd740fa88b9d9bfa95a05944eda8ac8e.webp",
    "/Real-View-WebP/c56ba4efed7635e7c96a83871cffb2fd.webp",
    "/Real-View-WebP/da1bd2d4d7a1a1d72753b03b6f06fc31.webp"
]

export default function RealSetupGallery() {
    const { settings } = useSiteSettings()

    // DEBUG LOGGING
    useEffect(() => {
        console.log('--- RealSetupGallery Settings Map ---', settings);
        console.log('--- Gallery Images found? ---', !!settings?.setup_gallery_images);
        if (settings?.setup_gallery_images) {
            console.log('--- Images list ---', settings.setup_gallery_images);
        }
    }, [settings]);

    const setupImages = Array.isArray(settings?.setup_gallery_images) && settings.setup_gallery_images.length > 0
        ? settings.setup_gallery_images
        : DEFAULT_SETUP_IMAGES

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
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="bg-[#55595a] hover:bg-[#55595a]/90 text-white h-auto py-2 px-6 rounded-md font-bold text-sm shadow-sm transition-all uppercase tracking-widest border-2 border-transparent hover:border-black/5"
                    >
                        <Maximize2 className="mr-2 w-4 h-4" /> SEE ALL SET-UP
                    </Button>
                </div>

                {/* Featured Preview - Scrollable on mobile/tablet, grid on desktop if few, but always scrollable if > 4 */}
                <div className="relative group/gallery">
                    <div className={cn(
                        "flex gap-4 pb-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide",
                        setupImages.length <= 4 && "md:grid md:grid-cols-4 md:overflow-hidden"
                    )}>
                        {setupImages.map((img, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "relative rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 cursor-pointer snap-start flex-shrink-0",
                                    "aspect-[4/3] w-[80%] md:w-full",
                                    setupImages.length <= 4 ? "md:max-w-none" : "md:w-[28%]"
                                )}
                                onClick={() => { setCurrentIndex(i); setIsOpen(true); }}
                            >
                                <Image src={img} alt={`Setup preview ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw" quality={80} />
                                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="text-white w-8 h-8" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {setupImages.length > 4 && (
                        <div className="flex justify-center gap-2 mt-4 md:hidden">
                            <div className="h-1 w-12 bg-primary rounded-full" />
                            <div className="h-1 w-4 bg-muted rounded-full" />
                            <div className="h-1 w-4 bg-muted rounded-full" />
                        </div>
                    )}
                </div>
            </div>

            {/* Cinematic Lightbox */}
            {
                isOpen && (
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
                                    aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
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
                )
            }
        </section >
    )
}
