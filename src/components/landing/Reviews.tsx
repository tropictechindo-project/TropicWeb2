'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function Reviews() {
  const { t } = useLanguage()
  const { getSetting } = useSiteSettings()

  const title = getSetting('reviews_title', null) || t('reviews')
  const text = getSetting('reviews_text', null)
  const reviewsData = getSetting('reviews_data', null)

  const defaultReviews = [
    {
      name: 'Skye Philipoom',
      rating: 5,
      date: '1 month ago',
      ulasanCount: 2,
      comment: 'Thr equipment was very good! Everything working right. Also delivery was very fast.',
    },
    {
      name: 'Yven Kharouni',
      rating: 5,
      date: '1 month ago',
      ulasanCount: 16,
      comment: 'I really recommend this company. I use to rent my set up with an other company before and this one is much better. Btw Tomy and Lutfi who installed my complet set up are really professional !',
    },
    {
      name: 'Mike Groot',
      rating: 5,
      date: '3 weeks ago',
      ulasanCount: 33,
      isLocalGuide: true,
      comment: "I've been using Tropic Tech Bali for my home office setup and the experience has been very smooth. Communication was clear, the setup was delivered quickly, and everything was installed properly. The equipment works well and the service has been reliable so far. I would definitely recommend them to anyone looking for a hassle-free workspace solution in Bali.",
    },
    {
      name: 'Dating by Marie',
      rating: 5,
      date: '1 month ago',
      ulasanCount: 5,
      comment: "I've been using Tropic Tech Bali as a remote office for a few months now and the experience has been great. The team is absolutely amazing, kind, responsive, and always helpful. Communication is smooth and they really make things easy and stress-free. You can tell they genuinely care about their clients. Highly recommend! 🌸",
    },
    {
      name: 'Matteo Durham',
      rating: 5,
      date: '1 month ago',
      ulasanCount: 4,
      comment: 'Just arrived in Bali 2 days ago, found these guys through an ad. Messaged and requested what I needed then within a few hours I had a complete setup delivered, really recommend this company to any digital nomads.',
    },
  ]

  const reviews = reviewsData || defaultReviews

  return (
    <section id="reviews" className="py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{title}</h2>
          {text && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-4 whitespace-pre-wrap">
              {text}
            </p>
          )}
          <div className="flex justify-center items-center gap-2 text-yellow-500">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
            <span className="text-xl font-bold text-foreground">5.0 / 5.0</span>
            <span className="text-muted-foreground ml-2">from 100+ happy clients</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-8">
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3">
                  <Card
                    className="h-full group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-background"
                  >
                    <CardContent className="pt-8 pb-6 px-7 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shadow-inner">
                            {review.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                              {review.name}
                              {review.isLocalGuide && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600 ring-1 ring-inset ring-orange-200">
                                  Local Guide
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground">{review.ulasanCount} ulasan</p>
                          </div>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute -top-4 -left-2 text-6xl text-primary/5 font-serif select-none pointer-events-none">"</span>
                        <p className="text-muted-foreground leading-relaxed italic relative z-10 text-[15px]">
                          {review.comment}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">{review.date}</span>
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">
                          Verified
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
            className="rounded-full px-12 h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all overflow-hidden group relative"
            onClick={() => window.open('https://maps.app.goo.gl/tNWoeabkn14KRLxx5', '_blank')}
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span className="relative z-10">Review Us on Google</span>
          </Button>

          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Real reviews from our Google Business Profile
          </p>
        </div>
      </div>
    </section>
  )
}
