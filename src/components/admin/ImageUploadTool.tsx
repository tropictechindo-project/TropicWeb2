"use client"

import React, { useState, useRef } from 'react'
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import heic2any from 'heic2any'

interface ImageUploadToolProps {
    value: string[]
    onChange: (urls: string[]) => void
    maxImages?: number
}

export function ImageUploadTool({ value = [], onChange, maxImages = 6 }: ImageUploadToolProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        if (value.length + files.length > maxImages) {
            toast.error(`You can only upload a maximum of ${maxImages} images.`)
            return
        }

        setIsUploading(true)
        const newUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                let file = files[i]

                // Automatically convert HEIC to JPEG on the client side
                if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                    toast.info(`Converting HEIC file... (${i + 1}/${files.length})`)
                    try {
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.9,
                        }) as Blob

                        file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                            type: 'image/jpeg'
                        })
                    } catch (heicError) {
                        toast.error(`Failed to convert HEIC file: ${file.name}`)
                        console.error(heicError)
                        continue
                    }
                }

                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch('/api/admin/upload-webp', {
                    method: 'POST',
                    body: formData
                })

                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(text || 'Upload failed')
                }

                const data = await res.json()
                if (data.url) {
                    newUrls.push(data.url)
                }
            }

            if (newUrls.length > 0) {
                onChange([...value, ...newUrls])
                toast.success(`Successfully uploaded and compressed ${newUrls.length} image(s) to WebP format.`)
            }
        } catch (error: any) {
            console.error(error)
            toast.error(`Upload error: ${error.message}`)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, i) => i !== indexToRemove))
    }

    return (
        <div className="space-y-4">
            {/* Gallery Grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {value.map((url, index) => (
                        <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted shadow-sm">
                            <img
                                src={url}
                                alt={`Upload ${index + 1}`}
                                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            {index === 0 && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10">
                                    MAIN COVER
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground backdrop-blur-sm shadow-md rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                title="Remove Image"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Zone */}
            {value.length < maxImages && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                    onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        handleUpload(e.dataTransfer.files)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer
                        transition-colors duration-200 overflow-hidden
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 bg-card hover:bg-muted/50'}
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg, image/png, image/webp, image/heic"
                        multiple
                        onChange={(e) => handleUpload(e.target.files)}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center text-primary space-y-3">
                            <Loader2 className="h-10 w-10 animate-spin" />
                            <p className="text-sm font-semibold tracking-tight">Compressing & Converting to WebP...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground space-y-3">
                            <div className="p-4 bg-background rounded-full shadow-sm border">
                                <UploadCloud className="h-8 w-8 text-primary/80" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-foreground">Click or Drag images here</p>
                                <p className="text-xs mt-1">Supports JPG, PNG, and iPhone HEIC.</p>
                                <p className="text-[10px] uppercase font-bold text-primary/60 mt-2 tracking-wider">
                                    Will auto-convert to ultra-compressed WebP format
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
