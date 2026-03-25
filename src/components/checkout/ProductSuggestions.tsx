'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Plus, Sparkles } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface ProductSuggestion {
    id: string
    name: string
    price: number
    imageUrl?: string
}

export default function ProductSuggestions({ productIds }: { productIds: string[] }) {
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
    const { addItem, items } = useCart()

    useEffect(() => {
        let isMounted = true
        if (productIds.length > 0) {
            fetch(`/api/products/suggestions?productIds=${productIds.join(',')}`)
                .then(res => res.json())
                .then(data => {
                    if (isMounted) {
                        setSuggestions(data.suggestions || [])
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch suggestions:', err)
                })
        }
        return () => { isMounted = false }
    }, [productIds])

    if (suggestions.length === 0) return null

    return (
        <div className="mt-8 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                    {productIds.length === 1 ? 'Frequently Rented Together' : 'Complete Your Professional Setup'}
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map(product => (
                    <div key={product.id} className="group relative flex items-center gap-4 p-4 border rounded-2xl bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black uppercase tracking-wide px-2 py-0.5 border-transparent">BEST PAIR</Badge>
                        </div>
                        
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-black/5">
                            {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1 italic">{product.name}</h4>
                            <p className="text-sm font-black text-primary mt-1">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Monthly Fee</p>
                        </div>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl font-black uppercase tracking-tighter hover:bg-primary hover:text-white border-primary/20 transition-all active:scale-95"
                            onClick={() => {
                                addItem({
                                    id: product.id,
                                    name: product.name,
                                    price: Number(product.price),
                                    type: 'PRODUCT',
                                    image: product.imageUrl
                                })
                                // Optional: Remove from suggestions once added
                                setSuggestions(prev => prev.filter(s => s.id !== product.id))
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
            {children}
        </span>
    )
}
