'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Mail, Phone, MapPin, Instagram } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-auto bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Tropic Tech</h3>
            <p className="text-sm text-muted-foreground">
```tsx
<span className="text-xs block">Operated By</span>
PT Tropic Tech International
```
            </p>
            <p className="text-sm text-muted-foreground">
              5+ Years in Bali - Leading the Industry
            </p>
            <p className="text-sm text-balance">
              Premium monitors, ergonomic desks, and smart accessories - delivered same day in Bali.
            </p>
          </div>

          {/* Get in Touch */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t('getInTouch')}</h4>
            <div className="space-y-3">
              <a href="mailto:tropictechindo@gmail.com" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" aria-label="Send us an email">
                <Mail className="h-4 w-4" />
                tropictechindo@gmail.com
              </a>
              <a href="https://wa.me/6282266574860" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" aria-label="Chat with us on WhatsApp">
                <Phone className="h-4 w-4" />
                +62 82266574860
              </a>
              <a href="https://maps.app.goo.gl/oaQhpew78fnHjmkB8" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" aria-label="View our location on Google Maps">
                <MapPin className="h-4 w-4" />
                Jl. Tunjungsari No.8, Bali
              </a>
              <a href="https://www.instagram.com/tropictechs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors" aria-label="Follow us on Instagram">
                <Instagram className="h-4 w-4" />
                @tropictechs
              </a>
              <a href="https://tr.ee/4hyKBmebuD" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary transition-colors" aria-label="Visit our Linktree">
                Linktree
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-sm hover:text-primary transition-colors">
                  {t('termsConditions')}
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm hover:text-primary transition-colors">
                  {t('refundPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Credits */}
          <div className="space-y-4">
            <h4 className="font-semibold">Credits</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <a href="https://indodesign.website" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors" aria-label="Visit IndoDesign website">
                indodesign.website
              </a>
              {' | '}
              <a href="https://indonesianvisas.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors" aria-label="Visit Indonesian Visas website">
                indonesianvisas.com
              </a>
              {' | '}
              <a href="https://balihelp.id" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors" aria-label="Visit Bali Help website">
                balihelp.id
              </a>
              {' | '}
              <a href="https://mybisnis.app" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors" aria-label="Visit MyBisnis app website">
                mybisnis.app
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
&copy; 2026 PT Tropic Tech International<sup>TM</sup>. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  )
}
