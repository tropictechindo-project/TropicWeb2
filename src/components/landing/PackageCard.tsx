'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { ShoppingCart, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SharePopover } from './SharePopover'
import { ProductDetailModal } from './ProductDetailModal'

interface PackageCardProps {
  package: {
    id: string
    name: string
    description: string
    price: number
    duration: number
    imageUrl?: string | null
    image_url?: string | null
    images?: string[]
    specs?: any
    items: Array<{
      id: string
      quantity: number
      product: {
        name: string
      }
    }>
    discountPercentage?: number
  }
}

export default function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const discountPercentage = pkg.discountPercentage || 0
  const discountedPrice = discountPercentage > 0 ? pkg.price * (1 - discountPercentage / 100) : pkg.price
  const displayImage = pkg.imageUrl || pkg.image_url || (pkg.images && pkg.images[0]) || '/MyAi.webp'


  const handleRentNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    const item = {
      id: pkg.id,
      type: 'PACKAGE' as const,
      name: pkg.name,
      price: discountedPrice,
      duration: pkg.duration,
      image: displayImage,
      quantity: 1
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
              alt={pkg.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <CardTitle className="line-clamp-1">{pkg.name}</CardTitle>
          <CardDescription className="line-clamp-2">{pkg.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Included Items:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pkg.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                    <span className="line-clamp-1">
                      {item.product.name} x {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('rentalDuration')}:</span>
                <span className="font-semibold">{pkg.duration} days</span>
              </div>
              <div className="flex justify-between font-semibold items-end">
                <span>{t('totalPrice')}:</span>
                <div className="flex flex-col items-end leading-tight">
                  {discountPercentage > 0 && (
                    <span className="text-xs line-through text-muted-foreground mb-1">
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="text-primary text-xl">Rp {discountedPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-2" onClick={(e) => e.stopPropagation()}>
          <Button className="flex-1" onClick={handleRentNow} aria-label={`Rent package ${pkg.name} now`}>
            Rent Now
          </Button>
          <AddToCartButton
            item={{
              id: pkg.id,
              type: 'PACKAGE',
              name: pkg.name,
              price: discountedPrice,
              duration: pkg.duration,
              image: displayImage,
              quantity: 1
            }}
          />
          <SharePopover
            title={pkg.name}
            text={pkg.description}
            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/product/${pkg.id}`}
          />
        </CardFooter>
      </Card>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={pkg}
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
    setTimeout(() => setIsAdded(false), 2000)
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
