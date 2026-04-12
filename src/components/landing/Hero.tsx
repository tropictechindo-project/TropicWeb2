'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import Image from 'next/image'

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

// Stable default \u2014 avoids reference change on every render
const DEFAULT_SETTINGS = {}

export default function Hero({ initialSettings = DEFAULT_SETTINGS }: HeroProps) {
  const { t } = useLanguage()
  // Only activate the hook when there are no server-provided settings
  const hasServerSettings = initialSettings && Object.keys(initialSettings).length > 0
  const { getSetting, loading } = useSiteSettings()

  const getVal = useCallback(<T,>(key: string, fallback: T): T => {
    if (hasServerSettings) return (initialSettings as Record<string, any>)[key] ?? fallback
    if (!loading) return getSetting(key, fallback)
    return fallback
  }, [hasServerSettings, initialSettings, loading, getSetting])

  const [imageOpacity, setImageOpacity] = useState<number>(() =>
    getVal('hero_opacity_default', 70)
  )

  useEffect(() => {
    if (!hasServerSettings && !loading) {
      setImageOpacity(getSetting('hero_opacity_default', 70))
    }
  }, [loading, hasServerSettings, getSetting])

  const scrollToProducts = useCallback(() => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const title = getVal('hero_title', null) ?? t('title')
  const subtitle = getVal('hero_subtitle', null) ?? t('subtitle')
  const subtitle2 = getVal('hero_subtitle2', null) ?? t('subtitle2')
  const heroImage = getVal('hero_image', null) ?? '/images/hero.webp'
  const showSlider = getVal('hero_show_slider', true)

  // Compute opacity layers as CSS values to avoid JS-driven layout recalcs
  const overlayOpacity = imageOpacity <= 20 ? imageOpacity / 20 : 1
  const fillOpacity = imageOpacity > 20 ? (imageOpacity - 20) / 80 : 0

  return (
    <section
      className="relative min-h-screen flex items-center w-full justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5"
      aria-labelledby="hero-title"
    >
      {/* Background image \u2014 LCP element, priority eager */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Tropic Tech - Remote Work Infrastructure Service"
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          loading="eager"
          sizes="100vw"
          quality={45}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
        {/* Fill overlay */}
        <div
          className="absolute inset-0 bg-background pointer-events-none"
          style={{ opacity: fillOpacity }}
        />
      </div>

      {/* Hero content */}
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
            className="text-lg px-10 py-5 h-auto font-black uppercase tracking-widest shadow-2xl hover:shadow-black/20 transition-all rounded-xl bg-black hover:bg-black/90 text-white border-2 border-white/10"
            onClick={scrollToProducts}
            aria-label="Rent Hardware Now - View our premium workstation catalog"
          >
            {t('rentNow')}
          </Button>
        </div>
      </div>

      {/* Opacity Slider \u2014 only rendered when enabled */}
      {showSlider && (
        <>
          {/* Desktop (Vertical) */}
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4 bg-background/20 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/10 z-20">
            <div className="h-48 flex items-center justify-center w-6">
              <Slider
                value={[imageOpacity]}
                onValueChange={(v) => setImageOpacity(v[0])}
                min={0} max={100} step={1}
                orientation="vertical"
                className="h-full min-h-0"
              />
            </div>
            <span className="text-xs font-bold text-primary whitespace-nowrap">{imageOpacity}%</span>
          </div>

          {/* Mobile (Horizontal) */}
          <div className="flex md:hidden absolute bottom-32 left-1/2 -translate-x-1/2 flex-row items-center gap-3 bg-background/20 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/10 z-20 w-[220px]">
            <Slider
              value={[imageOpacity]}
              onValueChange={(v) => setImageOpacity(v[0])}
              min={0} max={100} step={1}
              className="flex-1"
            />
            <span className="text-[10px] font-bold text-primary whitespace-nowrap min-w-[30px]">{imageOpacity}%</span>
          </div>
        </>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none" aria-hidden="true">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}

