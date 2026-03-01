'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useSiteSettings } from '@/hooks/useSiteSettings'

interface Review {
  name: string
  rating: number
  date: string
  comment: string
  photoUrl?: string
  isLocalGuide?: boolean
  reviewCount?: number
  ulasanCount?: number
}

const FALLBACK_REVIEWS: Review[] = [
  {
    name: 'Skye Philipoom',
    rating: 5,
    date: '1 month ago',
    comment: 'The equipment was very good! Everything working right. Also delivery was very fast.',
  },
  {
    name: 'Yven Kharouni',
    rating: 5,
    date: '1 month ago',
    ulasanCount: 16,
    comment: 'I really recommend this company. I use to rent my set up with an other company before and this one is much better. Btw Tomy and Lutfi who installed my complete set up are really professional!',
  },
  {
    name: 'Mike Groot',
    rating: 5,
    date: '3 weeks ago',
    ulasanCount: 33,
    isLocalGuide: true,
    comment: "I've been using Tropic Tech Bali for my home office setup and the experience has been very smooth. Communication was clear, the setup was delivered quickly, and everything was installed properly. Highly recommend!",
  },
  {
    name: 'Dating by Marie',
    rating: 5,
    date: '1 month ago',
    ulasanCount: 5,
    comment: "I've been using Tropic Tech Bali as a remote office for a few months now and the experience has been great. The team is absolutely amazing, kind, responsive, and always helpful. Highly recommend! 🌸",
  },
  {
    name: 'Matteo Durham',
    rating: 5,
    date: '1 month ago',
    ulasanCount: 4,
    comment: 'Just arrived in Bali 2 days ago, found these guys through an ad. Messaged and requested what I needed and within a few hours I had a complete setup delivered. Really recommend this company to any digital nomads.',
  },
]

export default function Reviews() {
  const { t } = useLanguage()
  const { getSetting } = useSiteSettings()

  const title = getSetting('reviews_title', null) || t('reviews')
  const text = getSetting('reviews_text', null)

  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS)
  const [overallRating, setOverallRating] = useState(5.0)
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [isFromGoogle, setIsFromGoogle] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchGoogleReviews() {
      try {
        // Use cache: 'no-store' to ensure we always get fresh data from our API route
        // (The API route itself handles caching the Google response for 1 hour)
        const res = await fetch('/api/reviews', { cache: 'no-store' })
        if (!res.ok) return

        const data = await res.json()
        if (cancelled) return

        // If API returned fallback:true, stay on dummy data
        if (data.fallback || !data.reviews?.length) return

        setReviews(data.reviews)
        setOverallRating(data.rating)
        setReviewCount(data.reviewCount)
        setIsFromGoogle(true)
      } catch {
        // Silently fall back to dummy reviews
      }
    }

    fetchGoogleReviews()
    return () => { cancelled = true }
  }, [])

  return (
    <section id="reviews" className="py-20 bg-muted/30 overflow-hidden" aria-label="Customer Reviews">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{title}</h2>
          {text && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4 whitespace-pre-wrap">{text}</p>
          )}
          <div className="flex justify-center items-center gap-2 text-yellow-500">
            <div className="flex" aria-label={`${overallRating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
            <span className="text-xl font-bold text-foreground">{overallRating.toFixed(1)} / 5.0</span>
            <span className="text-muted-foreground ml-2">
              {reviewCount ? `from ${reviewCount}+ reviews` : 'from 100+ happy clients'}
            </span>
            {isFromGoogle && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded">
                <svg className="h-3 w-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Live from Google
              </span>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-4 md:-ml-8">
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-background">
                    <CardContent className="pt-8 pb-6 px-7 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          {/* Avatar: real photo or initial */}
                          {review.photoUrl ? (
                            <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/10 flex-shrink-0">
                              <Image
                                src={review.photoUrl}
                                alt={review.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shadow-inner flex-shrink-0">
                              {review.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-base leading-tight flex items-center gap-1.5 flex-wrap">
                              {review.name}
                              {review.isLocalGuide && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600 ring-1 ring-inset ring-orange-200">
                                  Local Guide
                                </span>
                              )}
                            </h4>
                            {(review.ulasanCount || review.reviewCount) && (
                              <p className="text-xs text-muted-foreground">
                                {review.ulasanCount || review.reviewCount} reviews
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex text-yellow-500 flex-shrink-0" aria-label={`${review.rating} stars`}>
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute -top-4 -left-2 text-6xl text-primary/5 font-serif select-none pointer-events-none" aria-hidden="true">"</span>
                        <p className="text-muted-foreground leading-relaxed italic relative z-10 text-[15px] line-clamp-6">
                          {review.comment}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">{review.date}</span>
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">
                          {isFromGoogle ? '✓ Google Review' : 'Verified'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12 bg-background border-none shadow-md hover:bg-primary hover:text-white transition-colors h-12 w-12" />
              <CarouselNext className="-right-12 bg-background border-none shadow-md hover:bg-primary hover:text-white transition-colors h-12 w-12" />
            </div>
          </Carousel>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Have you worked with us before?</h3>
            <p className="text-muted-foreground">Share your experience and help our community grow.</p>
          </div>

          <Button
            size="lg"
            className="rounded-lg px-12 h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all overflow-hidden group relative"
            onClick={() => window.open('https://maps.app.goo.gl/tNWoeabkn14KRLxx5', '_blank')}
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">Review Us on Google</span>
          </Button>

          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isFromGoogle ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {isFromGoogle
              ? 'Live reviews from our Google Business Profile'
              : 'Real reviews from our Google Business Profile'}
          </p>
        </div>
      </div>
    </section>
  )
}
