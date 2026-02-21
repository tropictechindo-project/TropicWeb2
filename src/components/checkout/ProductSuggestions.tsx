'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface ProductSuggestion {
    id: string
    name: string
    price: number
    imageUrl?: string
}

export default function ProductSuggestions({ productIds }: { productIds: string[] }) {
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
    const { addItem } = useCart()

    useEffect(() => {
        let isMounted = true
        if (productIds.length > 0) {
            fetch(`/api/products/suggestions?productIds=${productIds.join(',')}`)
                .then(res => res.json())
                .then(data => {
                    if (isMounted) setSuggestions(data.suggestions || [])
                })
        }
        return () => { isMounted = false }
    }, [productIds])

    if (suggestions.length === 0) return null

    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">
                {productIds.length === 1 ? 'Frequently Rented Together' : 'Complete Your Setup'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-xl bg-card">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                            {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium line-clamp-1">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => addItem({
                                id: product.id,
                                name: product.name,
                                price: Number(product.price),
                                type: 'PRODUCT',
                                image: product.imageUrl
                            })}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
