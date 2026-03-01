"use client"

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/components/ui/dialog"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'

interface ImageLightboxViewerProps {
    images: string[]
    initialIndex?: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ImageLightboxViewer({ images, initialIndex = 0, open, onOpenChange }: ImageLightboxViewerProps) {
    if (!images || images.length === 0) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl w-screen h-screen m-0 p-0 bg-black/95 border-none flex flex-col justify-center items-center [&>button]:text-white [&>button]:bg-black/50 [&>button]:hover:bg-black/80">
                <DialogTitle className="sr-only">Image Gallery</DialogTitle>

                <Carousel
                    opts={{
                        align: "center",
                        loop: true,
                        startIndex: initialIndex
                    }}
                    className="w-full max-w-5xl px-12"
                >
                    <CarouselContent>
                        {images.map((img, index) => (
                            <CarouselItem key={index} className="flex items-center justify-center p-4 h-[80vh]">
                                <img
                                    src={img}
                                    alt={`Gallery image ${index + 1}`}
                                    className="max-w-full max-h-full object-contain rounded-md"
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {images.length > 1 && (
                        <>
                            <CarouselPrevious className="left-4 md:left-8 h-12 w-12 border-none bg-white/10 hover:bg-white/20 text-white" />
                            <CarouselNext className="right-4 md:right-8 h-12 w-12 border-none bg-white/10 hover:bg-white/20 text-white" />
                        </>
                    )}
                </Carousel>

                {images.length > 1 && (
                    <div className="absolute bottom-6 flex gap-2">
                        {images.map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-white/50"
                            />
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
