'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck, HeadphonesIcon, Shield, Clock, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useSiteSettings } from '@/hooks/useSiteSettings'




interface ServicesProps {
  initialSettings?: {
    services_title?: string
    services_text?: string
    services_data?: any
  }
}

export default function Services({ initialSettings }: ServicesProps) {
  const { t } = useLanguage()
  const { getSetting } = useSiteSettings()
  const [mounted, setMounted] = React.useState(false)

  const title = initialSettings?.services_title ?? getSetting('services_title', null) ?? t('services')
  const text = initialSettings?.services_text ?? getSetting('services_text', null)
  const servicesData = initialSettings?.services_data ?? getSetting('services_data', null)


  React.useEffect(() => {
    setMounted(true)
  }, [])

  const iconMap: Record<string, any> = {
    Truck, HeadphonesIcon, Shield, Clock, CheckCircle2
  }

  const defaultServices = [
    {
      icon: 'Truck',
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to your location anywhere in Bali',
      details: {
        highlights: [
          'Same-day delivery for orders before 12 PM',
          'Coverage across all major Bali areas (Canggu, Seminyak, Uluwatu, Ubud)',
          'Professional setup and hardware installation included',
          'Real-time delivery tracking and coordination'
        ],
        extraInfo: 'Our logistics team is dedicated to getting your workstation set up as quickly as possible, often within 4-6 hours of your request.'
      }
    },
    {
      icon: 'HeadphonesIcon',
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your needs',
      details: {
        highlights: [
          'On-site technical troubleshooting within 24 hours',
          'Immediate remote support for software/peripheral issues',
          'Hardware replacement guarantee if issues persist',
          'Communication via WhatsApp, Email, or Phone'
        ],
        extraInfo: 'We understand that your work doesn\'t always follow a 9-to-5 schedule. Our support team is always awake when you are.'
      }
    },
    {
      icon: 'Shield',
      title: 'Quality Assurance',
      description: 'High-quality equipment regularly maintained and inspected',
      details: {
        highlights: [
          'Rigorous 15-point inspection before every delivery',
          'Sanitization of all hardware using medical-grade products',
          'Premium brand partners: Dell, LG, Logitech, ErgoChair',
          'Regular hardware upgrade cycles ensuring modern performance'
        ],
        extraInfo: 'We take pride in the condition of our fleet. You won\'t find dusty or worn-out gear at Tropic Tech.'
      }
    },
    {
      icon: 'Clock',
      title: 'Flexible Rentals',
      description: 'Rent for any duration - daily, weekly, or monthly plans available',
      details: {
        highlights: [
          'Easy extensions via our user dashboard',
          'No long-term contracts or security deposits required',
          'Prorated daily rates for mid-month extensions',
          'Custom enterprise solutions for teams and retreats'
        ],
        extraInfo: 'Whether you are in Bali for a weekend or a year, we have a rental structure that fits your itinerary.'
      }
    },
  ]

  const services = (servicesData || defaultServices).map((s: any) => ({
    ...s,
    icon: iconMap[s.icon] || Truck // Fallback icon
  }))

  return (
    <section id="services" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
        {text && (
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 -mt-8 whitespace-pre-wrap">
            {text}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const content = (
              <Card
                className="text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary outline-none"
                role="button"
                tabIndex={0}
                aria-label={`Learn more about our ${service.title} service`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (document.querySelector(`[data-service-trigger="${index}"]`) as HTMLElement)?.click();
                  }
                }}
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{service.description}</p>
                  <p className="mt-4 text-sm font-medium text-primary">Click to learn more →</p>
                </CardContent>
              </Card>
            )

            if (!mounted) return <div key={`static-${index}`}>{content}</div>

            return (
              <Dialog key={index}>
                <DialogTrigger asChild data-service-trigger={index}>
                  {content}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <service.icon className="h-6 w-6 text-primary" />
                      </div>
                      <DialogTitle className="text-2xl">{service.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                      {service.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid gap-3">
                      {service.details.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm md:text-base">{highlight}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm italic text-muted-foreground">
                        {service.details.extraInfo}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      </div>
    </section>
  )
}
