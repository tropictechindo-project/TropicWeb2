'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FullscreenImageModalProps {
    images: string[]
    initialIndex: number
    isOpen: boolean
    onClose: () => void
}

export function FullscreenImageModal({ images, initialIndex, isOpen, onClose }: FullscreenImageModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        setCurrentIndex(initialIndex)
    }, [initialIndex, isOpen])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') handlePrevious()
            if (e.key === 'ArrowRight') handleNext()
        }

        if (isOpen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, currentIndex, images.length])

    const handlePrevious = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-10"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {images.length > 1 && (
                        <button
                            onClick={handlePrevious}
                            className="absolute left-6 xl:left-12 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-10"
                        >
                            <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
                        </button>
                    )}

                    <div
                        className="relative w-full h-full md:w-[85vw] md:h-[85vh] flex items-center justify-center p-4 md:p-8"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={images[currentIndex]}
                                    alt={`Gallery Image ${currentIndex + 1}`}
                                    fill
                                    className="object-contain"
                                    quality={100}
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {images.length > 1 && (
                        <button
                            onClick={handleNext}
                            className="absolute right-6 xl:right-12 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-all z-10"
                        >
                            <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
                        </button>
                    )}

                    {images.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full overflow-hidden">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setCurrentIndex(idx)
                                    }}
                                    className={`transition-all rounded-full ${currentIndex === idx ? 'w-4 h-2.5 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
