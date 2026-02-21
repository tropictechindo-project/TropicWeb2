'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

const currencyRates: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  AUD: 1.53,
  KWD: 0.31,
  BHD: 0.38,
  CNY: 7.24,
  INR: 83.12,
  IDR: 15650,
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  AUD: 'A$',
  KWD: 'د.ك',
  BHD: 'BD',
  CNY: '¥',
  INR: '₹',
  IDR: 'Rp',
}

interface OrderPopupProps {
  isOpen: boolean
  onClose: () => void
  item: {
    type: 'PRODUCT' | 'PACKAGE'
    id: string
    name: string
    price: number
    duration?: number
  }
}

export default function OrderPopup({ isOpen, onClose, item }: OrderPopupProps) {
  const { t } = useLanguage()
  const [currency, setCurrency] = useState('USD')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })
  const { user } = useAuth()

  useEffect(() => {
    // Reset form when popup opens
    if (isOpen) {
      setCurrency('USD')
      setPaymentMethod('CASH')
      setDeliveryAddress('')
      setNotes('')
      setGuestInfo({ name: '', email: '', whatsapp: '' })
    }
  }, [isOpen])

  const totalPrice = item.price
  const convertedPrice = totalPrice * (currencyRates[currency] / 15650) // Convert from IDR to selected currency

  const handleOrder = async () => {
    try {
      setIsSubmitting(true)

      if (!user) {
        // Guest order - validate guest info
        if (!guestInfo.name || !guestInfo.email || !guestInfo.whatsapp) {
          toast.error('Please fill in all guest information')
          setIsSubmitting(false)
          return
        }
      }

      const orderData = {
        item,
        currency,
        paymentMethod,
        deliveryAddress,
        notes,
        guestInfo: user ? undefined : guestInfo,
      }

      if (paymentMethod === 'WHATSAPP') {
        // Redirect to WhatsApp
        const message = `Hello Tropic Tech! I would like to order:\n\n${item.name}\nDuration: ${item.duration || '30'} days\nPrice: ${currencySymbols[currency]}${convertedPrice.toFixed(2)}\n\nPayment Method: WhatsApp Order\n\n${deliveryAddress ? `Delivery Address: ${deliveryAddress}` : ''}${notes ? `\n\nNotes: ${notes}` : ''}`
        const whatsappUrl = `https://wa.me/6282266574860?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
        onClose()
        toast.success('Redirecting to WhatsApp...')
        return
      }

      if (paymentMethod === 'FORMSPREE') {
        // Submit via Formspree
        const formData = new FormData()
        formData.append('orderType', item.type)
        formData.append('itemName', item.name)
        formData.append('price', totalPrice.toString())
        formData.append('currency', currency)
        formData.append('duration', (item.duration || 30).toString())
        formData.append('paymentMethod', paymentMethod)
        formData.append('deliveryAddress', deliveryAddress)
        formData.append('notes', notes)
        if (!user) {
          formData.append('guestName', guestInfo.name)
          formData.append('guestEmail', guestInfo.email)
          formData.append('guestWhatsapp', guestInfo.whatsapp)
        }

        // You need to set up your Formspree form endpoint
        const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || 'https://formspree.io/f/YOUR_FORM_ID'

        const response = await fetch(formspreeEndpoint, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        })

        if (response.ok) {
          toast.success('Order submitted successfully!')
          onClose()
        } else {
          toast.error('Failed to submit order')
        }
      } else {
        // Create order via API
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: user ? `Bearer ${localStorage.getItem('token')}` : '',
          },
          body: JSON.stringify(orderData),
        })

        if (response.ok) {
          const data = await response.json()
          toast.success('Order placed successfully!')
          onClose()
          if (user) {
            window.location.href = '/dashboard/user'
          }
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to place order')
        }
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('orderPopup')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="font-semibold">{item.name}</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span>{item.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('rentalDuration')}:</span>
              <span>{item.duration || 30} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('unitPrice')}:</span>
              <span>Rp {item.price.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Guest Info for non-logged in users */}
          {!user && (
            <div className="space-y-3">
              <h4 className="font-semibold">Guest Information</h4>
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestWhatsapp">WhatsApp *</Label>
                <Input
                  id="guestWhatsapp"
                  value={guestInfo.whatsapp}
                  onChange={(e) => setGuestInfo({ ...guestInfo, whatsapp: e.target.value })}
                  placeholder="+62..."
                />
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>{t('currency')}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencySymbols).map(([code, symbol]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center text-xl font-bold p-4 bg-primary/10 rounded-lg">
            <span>{t('totalPrice')}:</span>
            <span className="text-primary">
              {currencySymbols[currency]}{convertedPrice.toFixed(2)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('selectPaymentMethod')}</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PAYPAL" id="paypal" />
                <Label htmlFor="paypal" className="cursor-pointer">
                  {t('paypal')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="STRIPE" id="stripe" />
                <Label htmlFor="stripe" className="cursor-pointer">
                  {t('stripe')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="WHATSAPP" id="whatsapp" />
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  {t('whatsapp')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FORMSPREE" id="formspree" />
                <Label htmlFor="formspree" className="cursor-pointer">
                  {t('formspree')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CASH" id="cash" />
                <Label htmlFor="cash" className="cursor-pointer">
                  {t('cash')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Delivery Address</Label>
            <Textarea
              id="deliveryAddress"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address in Bali..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleOrder} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : t('placeOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
