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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Tropic Tech Workstation Rental Bali"
          fill
          className="object-cover transition-all duration-300"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          quality={85}
        />
        {/* Layer 1: the user's exact "Crystal Clear" baseline (20% or less) */}
        <div
          className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background via-background/20 to-transparent transition-all duration-300 pointer-events-none"
          style={{ opacity: imageOpacity <= 20 ? imageOpacity / 20 : 1 }}
        />
        {/* Layer 2: The fill layer for values above 20% */}
        <div
          className="absolute inset-0 bg-background transition-all duration-300 pointer-events-none"
          style={{ opacity: imageOpacity > 20 ? (imageOpacity - 20) / 80 : 0 }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-4 text-slate-700 dark:text-slate-300 font-medium animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
          {subtitle}
        </p>
        <p className="text-lg md:text-xl mb-8 text-slate-600 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          {subtitle2}
        </p>
        <div className="flex flex-col items-center gap-4 mt-16 md:mt-32 animate-in fade-in zoom-in duration-1000 delay-300">
          <Button
            size="lg"
            className="text-lg px-8 py-4 h-auto font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-md overflow-hidden group relative"
            onClick={scrollToProducts}
            aria-label="Scroll to workstation rentals"
            name="CTA Search (Src)"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span className="relative z-10">{t('rentNow')}</span>
          </Button>
        </div>
      </div>

      {/* Responsive Opacity Slider */}
      {showSlider && (
        <>
          {/* Desktop Version (Vertical) */}
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4 bg-background/20 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/10 z-20 animate-in fade-in slide-in-from-right-10 duration-1000">
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

          {/* Mobile Version (Horizontal) */}
          <div className="flex md:hidden absolute bottom-32 left-1/2 -translate-x-1/2 flex-row items-center gap-3 bg-background/20 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/10 z-20 w-[220px] animate-in fade-in slide-in-from-bottom-10 duration-3000 delay-1000 ease-in-out">
            <Slider
              value={[imageOpacity]}
              onValueChange={(value) => setImageOpacity(value[0])}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] font-bold text-primary whitespace-nowrap min-w-[30px]">
              {imageOpacity}%
            </span>
          </div>
        </>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section >
  )
}
