'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'


interface ProductsProps {
  initialProducts?: any[]
}

export default function Products({ initialProducts = [] }: ProductsProps) {
  const { t } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState<any[]>(initialProducts)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [api, setApi] = useState<CarouselApi>()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (initialProducts.length > 0) {
      // Initialize categories from props
      const uniqueCategories = Array.from(
        new Set(initialProducts.map((p: any) => p.category))
      ) as string[]
      setCategories(['All', ...uniqueCategories.sort()])
    } else {
      fetchProducts()
    }
  }, [initialProducts])

  useEffect(() => {
    if (api) {
      api.scrollTo(0)
    }
  }, [selectedCategory, api])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        const fetchedProducts = data.products
        setProducts(fetchedProducts)

        // Extract unique categories from actual products
        const uniqueCategories = Array.from(
          new Set(fetchedProducts.map((p: any) => p.category))
        ) as string[]
        setCategories(['All', ...uniqueCategories.sort()])
      }
    } catch (err) {
      console.error(err)
    }
  }


  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchQuery) {
          setIsSearchOpen(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef, searchQuery]);

  return (
    <section id="products" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          {t('products')}
        </h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
          <div ref={searchRef} className="relative flex items-center transition-all duration-300 ease-in-out">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary transition-colors z-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <div className={cn(
              "absolute left-0 top-0 h-10 bg-background border rounded-full overflow-hidden transition-all duration-300 flex items-center",
              isSearchOpen || searchQuery.length > 0 ? "w-64 pl-10 pr-4 opacity-100" : "w-10 opacity-0 pointer-events-none"
            )}>
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-transparent border-none outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus={isSearchOpen}
              />
            </div>
          </div>

          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full capitalize px-6 font-bold"
            >
              {cat}
            </Button>
          ))}
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false, // Changed to false for better UX when filtering
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {filteredProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-[80%] md:basis-1/2 lg:basis-1/4">
                <div className="p-1 h-full">
                  {/* Product Schema Markup */}
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": product.name,
                        "description": product.description,
                        "image": product.image,
                        "category": product.category,
                        "offers": {
                          "@type": "Offer",
                          "price": product.basePrice,
                          "priceCurrency": "IDR",
                          "availability": "https://schema.org/InStock",
                          "seller": {
                            "@type": "Organization",
                            "name": "Tropic Tech Bali"
                          }
                        }
                      })
                    }}
                  />
                  <ProductCard
                    product={product}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      </div>
    </section>
  )
}
