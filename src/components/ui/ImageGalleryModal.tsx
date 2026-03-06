'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageGalleryModalProps {
    images: string[]
    initialIndex?: number
    isOpen: boolean
    onClose: () => void
}

export function ImageGalleryModal({ images, initialIndex = 0, isOpen, onClose }: ImageGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Reset index when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
            document.body.style.overflow = 'hidden' // Prevent bg scrolling
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen, initialIndex])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowRight') showNext()
        if (e.key === 'ArrowLeft') showPrev()
    }, [isOpen, onClose])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    if (!isOpen || images.length === 0) return null

    const showNext = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % images.length) // Infinite loop right
    }

    const showPrev = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length) // Infinite loop left
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Context Header */}
            <div className="absolute top-4 right-4 z-[10000] flex items-center gap-4">
                <div className="text-white/70 text-sm font-bold tracking-widest bg-black/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    {currentIndex + 1} / {images.length}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={showPrev}
                        className="absolute left-4 md:left-8 z-[10000] h-12 w-12 bg-black/50 hover:bg-black/70 text-white border border-white/10 rounded-full transition-colors backdrop-blur-md"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={showNext}
                        className="absolute right-4 md:right-8 z-[10000] h-12 w-12 bg-black/50 hover:bg-black/70 text-white border border-white/10 rounded-full transition-colors backdrop-blur-md"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}

            {/* Main Image Container */}
            <div
                className="relative w-full max-w-5xl aspect-[4/3] md:aspect-video flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={images[currentIndex]}
                    alt={`Gallery image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                />
            </div>

            {/* Thumbnail Strip (if multiple images) */}
            {images.length > 1 && (
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 border border-white/10 rounded-xl backdrop-blur-md overflow-x-auto max-w-[90vw] z-[10000]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "relative h-12 w-16 md:h-16 md:w-24 flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 border-2",
                                currentIndex === idx ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="100px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
