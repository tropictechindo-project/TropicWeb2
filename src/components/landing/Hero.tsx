'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import Image from 'next/image'
import { cn } from '@/lib/utils'


interface HeroProps {
  initialSettings?: {
    hero_title?: string
    hero_subtitle?: string
    hero_subtitle2?: string
    hero_image?: string
    hero_opacity_default?: number
    hero_show_slider?: boolean
  }
}

export default function Hero({ initialSettings }: HeroProps) {
  const { t } = useLanguage()
  const { getSetting, loading } = useSiteSettings()

  // Use server props or fallback to hook/defaults
  const defaultOpacity = initialSettings?.hero_opacity_default ?? getSetting('hero_opacity_default', 70)
  const showSlider = initialSettings?.hero_show_slider ?? getSetting('hero_show_slider', true)

  const [imageOpacity, setImageOpacity] = useState(defaultOpacity)

  // Update local state when setting loads (client-side override if needed)
  useEffect(() => {
    if (!loading && !initialSettings) {
      setImageOpacity(getSetting('hero_opacity_default', 70))
    }
  }, [loading, initialSettings, getSetting])

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Content with fallback to props -> hook -> translation -> default
  const title = initialSettings?.hero_title ?? getSetting('hero_title', null) ?? t('title')
  const subtitle = initialSettings?.hero_subtitle ?? getSetting('hero_subtitle', null) ?? t('subtitle')
  const subtitle2 = initialSettings?.hero_subtitle2 ?? getSetting('hero_subtitle2', null) ?? t('subtitle2')
  const heroImage = initialSettings?.hero_image ?? getSetting('hero_image', null) ?? '/images/hero.webp'


  return (
    <section
      className="relative min-h-screen flex items-center w-full justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Tropic Tech - #1 Workstation & Office Equipment Rental Bali"
            fill
            className="object-cover"
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={85}
          />
        </div>

        {/* Improved visibility layer */}
        <div
          className="absolute inset-0 bg-background/30 backdrop-blur-[2px] pointer-events-none z-0"
          style={{ opacity: imageOpacity / 100 }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight tracking-tight uppercase">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-4 text-slate-800 dark:text-slate-200 font-bold">
          {subtitle}
        </p>
        <p className="text-lg md:text-xl mb-8 text-slate-700 dark:text-slate-300 font-medium">
          {subtitle2}
        </p>
        <div className="flex flex-col items-center gap-4 mt-8 md:mt-16">
          <Button
            size="lg"
            className="text-lg px-10 py-6 h-auto font-black uppercase tracking-tighter shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all rounded-xl group relative overflow-hidden bg-primary text-white"
            onClick={scrollToProducts}
            aria-label="Rent Hardware Now"
          >
            <span className="relative z-10">{t('rentNow')}</span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Responsive Opacity Slider */}
      {showSlider && (
        <>
          {/* Desktop Version (Vertical) */}
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4 bg-background/20 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/10 z-20">
            <div className="h-48 flex items-center justify-center w-6">
              <Slider
                value={[imageOpacity]}
                onValueChange={(value) => setImageOpacity(value[0])}
                min={0}
                max={100}
                step={1}
                orientation="vertical"
                className="h-full min-h-0"
              />
            </div>
            <span className="text-xs font-bold text-primary whitespace-nowrap">
              {imageOpacity}%
            </span>
          </div>
        </>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none" aria-hidden="true">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section >
  )
}
