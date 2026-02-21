'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Trash2, ArrowLeft, Globe, CreditCard, Smartphone, Bitcoin, Terminal, QrCode, Landmark, Banknote } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { toast } from 'sonner'
import { countries, normalizeWhatsApp, getCountryInfo } from '@/lib/utils/whatsapp'
import { AlertCircle } from 'lucide-react'
import ProductSuggestions from '@/components/checkout/ProductSuggestions'

const paymentMethods = [
    { id: 'WISE', name: 'Wise', icon: <Globe className="h-6 w-6" />, desc: 'International transfer' },
    { id: 'STRIPE', name: 'Stripe', icon: <CreditCard className="h-6 w-6" />, desc: 'Secure card payment' },
    { id: 'PAYPAL', name: 'PayPal', icon: <CreditCard className="h-6 w-6" />, desc: 'Fast & easy' },
    { id: 'APPLE_PAY', name: 'Apple Pay', icon: <Smartphone className="h-6 w-6" />, desc: 'Apple device payment' },
    { id: 'VISA_MASTERCARD', name: 'Visa/Mastercard', icon: <CreditCard className="h-6 w-6" />, desc: 'Credit/Debit Card' },
    { id: 'CRYPTO', name: 'Crypto', icon: <Bitcoin className="h-6 w-6" />, desc: 'BTC, ETH, USDT' },
    { id: 'EDC', name: 'EDC Machine', icon: <Terminal className="h-6 w-6" />, desc: 'Swipe on delivery' },
    { id: 'QRIS', name: 'QRIS', icon: <QrCode className="h-6 w-6" />, desc: 'Scan to pay' },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <Landmark className="h-6 w-6" />, desc: 'Direct bank transfer' },
    { id: 'CASH', name: 'Cash', icon: <Banknote className="h-6 w-6" />, desc: 'Pay on delivery' },
]

export default function CheckoutPage() {
    const { items, removeItem, totalPrice, clearCart } = useCart()
    const { user } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        whatsapp: user?.whatsapp || '',
        address: '',
        linkAddress: '', // Google Maps Link
    })
    const [paymentMethod, setPaymentMethod] = useState('WISE')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check if any item is out of stock
    const hasOutOfStockItems = items.some(item => (item as any).stock === 0)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleWhatsAppRedirect = () => {
        const adminNumber = '6282266574860'
        const message = encodeURIComponent('Hello, i want to Rent but the stock is empty, can you help me with that?')
        window.open(`https://wa.me/${adminNumber}?text=${message}`, '_blank')
    }

    const handleBuy = async () => {
        if (!formData.name || !formData.email || !formData.whatsapp || !formData.address) {
            toast.error('Please fill in all required fields')
            return
        }

        if (hasOutOfStockItems) {
            toast.error('Some items in your cart are out of stock. Please use the WhatsApp contact.')
            return
        }

        setIsSubmitting(true)

        try {
            // 1. Create Order
            const orderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Standard token retrieval
                },
                body: JSON.stringify({
                    items: items.map(item => ({ id: item.id, price: item.price })),
                    paymentMethod,
                    deliveryAddress: formData.address,
                    guestInfo: {
                        fullName: formData.name,
                        email: formData.email,
                        whatsapp: formData.whatsapp
                    }
                })
            })

            const orderData = await orderRes.json()
            if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order')

            const orderId = orderData.order.id

            // 2. Initiate Payment
            const payRes = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    orderId,
                    provider: paymentMethod,
                    amount: totalPrice
                })
            })

            const payData = await payRes.json()
            if (!payRes.ok) throw new Error(payData.error || 'Failed to initiate payment')

            toast.success('Order placed successfully! ' + payData.instructions)
            clearCart()

            // Redirect to order details or success page
            setTimeout(() => {
                router.push('/')
            }, 3000)

        } catch (error: any) {
            toast.error(error.message || 'Payment initiation failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                    <Button onClick={() => router.push('/')}>Back to Home</Button>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-24 md:py-32">
                <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent" onClick={() => router.push('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>

                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Form & Payment */}
                    <div className="space-y-8">

                        {/* Customer Details */}
                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6">Details</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">Whatsapp (Include Country Code)</Label>
                                        <div className="relative">
                                            {getCountryInfo(formData.whatsapp) && (
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10 pointer-events-none">
                                                    {getCountryInfo(formData.whatsapp)?.flag}
                                                </div>
                                            )}
                                            <Input
                                                id="whatsapp"
                                                name="whatsapp"
                                                value={formData.whatsapp}
                                                onChange={handleInputChange}
                                                placeholder="+62 812..."
                                                className={getCountryInfo(formData.whatsapp) ? "pl-10" : ""}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            e.g., +62812345678 (WhatsApp will auto-detect your flag)
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Delivery Address</Label>
                                    <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Villa address, street, etc." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkAddress">Google Maps Link (Optional)</Label>
                                    <Input id="linkAddress" name="linkAddress" value={formData.linkAddress} onChange={handleInputChange} placeholder="https://maps.google.com/..." />
                                </div>
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="bg-card border rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="relative">
                                        <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                                        <Label
                                            htmlFor={method.id}
                                            className="flex flex-col items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all h-full"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="text-primary">{method.icon}</div>
                                                <span className="font-semibold">{method.name}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{method.desc}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Product Suggestions */}
                        <ProductSuggestions productIds={items.map(i => i.id)} />

                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:pl-8">
                        <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-semibold mb-6">Order Review</h2>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                                        {item.image ? (
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Quantity: {item.quantity}
                                            </p>
                                            <p className="text-sm font-semibold mt-1">
                                                Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-2">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">Rp {totalPrice.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {hasOutOfStockItems && (
                                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-orange-700 font-bold text-sm uppercase tracking-tight">
                                        <AlertCircle className="h-4 w-4" />
                                        Set Order new Equipment
                                    </div>
                                    <p className="text-xs text-orange-600 font-medium">
                                        Some items are currently out of stock. We can arrange it for you via our personal support.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 font-bold"
                                        onClick={handleWhatsAppRedirect}
                                    >
                                        Contact Admin (Empty Stock)
                                    </Button>
                                </div>
                            )}

                            <div className="mt-8">
                                <Button
                                    className="w-full text-lg py-6"
                                    onClick={handleBuy}
                                    disabled={isSubmitting || hasOutOfStockItems}
                                >
                                    {isSubmitting ? 'Processing...' : hasOutOfStockItems ? 'Unavailable' : 'Pay Now'}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    By clicking "Pay Now", you agree to our terms and conditions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
