'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FAQ() {
  const { t } = useLanguage()
  const { getSetting } = useSiteSettings()

  const title = getSetting('faq_title', null) || t('faq')
  const text = getSetting('faq_text', null)
  const faqData = getSetting('faq_data', null)

  const defaultFaqs = [
    {
      question: 'How do I rent equipment?',
      answer: 'Simply browse our products, select the duration, and click Order. You\'ll be guided through the checkout process with multiple payment options available.',
    },
    {
      question: 'What is the minimum rental period?',
      answer: 'Our minimum rental period is 1 day. You can rent equipment for as long as you need - from daily to monthly rentals.',
    },
    {
      question: 'Do you offer delivery services?',
      answer: 'Yes, we offer fast delivery across Bali. Delivery fees may apply depending on your location.',
    },
    {
      question: 'What happens if equipment is damaged?',
      answer: 'Minor wear and tear is expected. For significant damage, please contact us immediately. We offer protection plans for additional peace of mind.',
    },
    {
      question: 'Can I extend my rental period?',
      answer: 'Yes! You can extend your rental anytime through your dashboard or by contacting our support team.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept PayPal, credit/debit cards, Stripe, cryptocurrency, cash, and WhatsApp orders.',
    },
  ]

  const faqs = (faqData && faqData.length > 0) ? faqData : defaultFaqs

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <section id="faq" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
          {text && (
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 -mt-8 whitespace-pre-wrap">
              {text}
            </p>
          )}
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Static placeholder to prevent layout shift */}
            {faqs.map((faq, index) => (
              <div key={index} className="border-b py-4">
                <div className="font-medium">{faq.question}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Button asChild size="lg" className="rounded-lg px-12 h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all">
              <Link href="/faq">
                See All FAQ
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="faq" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
        {text && (
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 -mt-8 whitespace-pre-wrap">
            {text}
          </p>
        )}

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-16 flex justify-center">
          <Button asChild size="lg" className="rounded-lg px-12 h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all">
            <Link href="/faq">
              See All FAQ
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
