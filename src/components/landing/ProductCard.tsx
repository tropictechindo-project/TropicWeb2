'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCart } from '@/contexts/CartContext'
import { ShoppingCart, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SharePopover } from './SharePopover'
import { ProductDetailModal } from './ProductDetailModal'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    category: string
    monthlyPrice?: number
    monthly_price?: number
    stock: number
    image_url?: string | null
    imageUrl?: string | null
    images?: string[]
    specs?: any
    discountPercentage?: number
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [duration, setDuration] = useState(30)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const price = product.monthlyPrice || product.monthly_price || 0
  const discountPercentage = product.discountPercentage || 0
  const discountedPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price

  const dailyPrice = Math.ceil(discountedPrice / 30)
  const originalDailyPrice = Math.ceil(price / 30)

  const totalPrice = dailyPrice * duration
  const displayImage = product.imageUrl || product.image_url || (product.images && product.images[0]) || '/MyAi.webp'


  const handleRentNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    const item = {
      id: product.id,
      type: 'PRODUCT' as const,
      name: product.name,
      price: dailyPrice * duration,
      duration: duration,
      image: displayImage,
      quantity: 1,
      stock: product.stock
    }
    addItem(item)
    router.push('/checkout')
  }

  return (
    <>
      <Card
        className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="relative aspect-video w-full mb-3 rounded-lg overflow-hidden bg-muted">
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm shadow-lg">
                  SAVE {discountPercentage}%
                </div>
              </div>
            )}
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>

          <CardTitle className="line-clamp-1">{product.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('daily')}:</span>
              <span className="font-semibold">
                Rp {dailyPrice.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('monthly')}:</span>
              <div className="flex flex-col items-end">
                {discountPercentage > 0 && (
                  <span className="text-[10px] line-through text-muted-foreground">
                    Rp {price.toLocaleString('id-ID')}
                  </span>
                )}
                <span className="font-semibold">
                  Rp {discountedPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <label className="text-sm font-medium">
                {t('rentalDuration')} (days)
              </label>
              <Input
                type="number"
                min="1"
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value) || 1)
                }
              />
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>{t('totalPrice')}:</span>
                <span className="text-primary">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            className="flex-1"
            onClick={handleRentNow}
            disabled={product.stock === 0}
            aria-label={product.stock === 0 ? `Product out of stock` : `Rent ${product.name} now`}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Rent Now'}
          </Button>
          <AddToCartButton
            item={{
              id: product.id,
              type: 'PRODUCT',
              name: product.name,
              price: dailyPrice * duration,
              duration: duration,
              image: displayImage,
              quantity: 1,
              stock: product.stock
            }}
          />
          <SharePopover
            title={product.name}
            text={product.description}
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.id}`}
          />
        </CardFooter>
      </Card>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </>
  )
}

function AddToCartButton({ item }: { item: any }) {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = () => {
    addItem(item)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000) // Reset after 2s
    toast.success(`${item.name} added to cart`)
  }

  return (
    <Button
      variant={isAdded ? "default" : "outline"}
      size="icon"
      onClick={handleAdd}
      className={cn("transition-colors", isAdded && "bg-green-600 hover:bg-green-700 text-white")}
      title="Add to Cart"
    >
      {isAdded ? (
        <span className="text-xs font-bold">Added</span>
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
    </Button>
  )
}
