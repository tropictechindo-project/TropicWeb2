'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import PackageCard from './PackageCard'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'


interface PackagesProps {
  initialPackages?: any[]
}

export default function Packages({ initialPackages = [] }: PackagesProps) {
  const { t } = useLanguage()
  const [packages, setPackages] = useState<any[]>(initialPackages)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (initialPackages.length === 0) {
      fetchPackages()
    }
  }, [initialPackages])

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    }
  }


  return (
    <section id="packages" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">{t('packages')}</h2>

        {packages.length > 0 ? (
          <div className="relative w-full mt-12">
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: false,
                dragFree: true,
                containScroll: "trimSnaps",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {packages.map((pkg) => (
                  <CarouselItem key={pkg.id} className="pl-4 basis-[82%] sm:basis-[45%] lg:basis-1/4">
                    <div className="h-full pt-4 pb-8">
                      {isMounted ? (
                        <PackageCard package={pkg} />
                      ) : (
                        <div className="h-full w-full bg-muted animate-pulse rounded-xl" />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12 h-12 w-12 border-2 bg-background/80 hover:bg-background shadow-lg" />
                <CarouselNext className="-right-12 h-12 w-12 border-2 bg-background/80 hover:bg-background shadow-lg" />
              </div>
            </Carousel>

            {/* Pagination Dots */}
            {isMounted && count > 0 && (
              <div className="flex justify-center gap-2 mt-4 md:hidden">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      current === i ? "bg-primary w-4" : "bg-primary/20"
                    )}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No packages found</p>
          </div>
        )}
      </div>
    </section>
  )
}
