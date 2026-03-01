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
} from '@/components/ui/carousel'


interface PackagesProps {
  initialPackages?: any[]
}

export default function Packages({ initialPackages = [] }: PackagesProps) {
  const { t } = useLanguage()
  const [packages, setPackages] = useState<any[]>(initialPackages)

  useEffect(() => {
    if (initialPackages.length === 0) {
      fetchPackages()
    }
  }, [initialPackages])

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
          <div className="relative w-full max-w-6xl mx-auto px-12 mt-12">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {packages.map((pkg) => (
                  <CarouselItem key={pkg.id} className="pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                    <div className="h-full pt-4 pb-8">
                      <PackageCard package={pkg} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-4 md:-left-12 lg:-left-16 h-12 w-12 border-2 bg-background/80 hover:bg-background shadow-lg" />
              <CarouselNext className="absolute -right-4 md:-right-12 lg:-right-16 h-12 w-12 border-2 bg-background/80 hover:bg-background shadow-lg" />
            </Carousel>
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
