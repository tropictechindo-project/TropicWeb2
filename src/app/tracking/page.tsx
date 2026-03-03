"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Package, ArrowRight, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function TrackingSearchPage() {
    const router = useRouter()
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [email, setEmail] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!invoiceNumber.trim()) {
            toast.error('Please enter your invoice number')
            return
        }
        setIsSearching(true)
        try {
            const res = await fetch(`/api/tracking/lookup?invoiceNumber=${encodeURIComponent(invoiceNumber.trim())}&email=${encodeURIComponent(email.trim())}`)
            if (!res.ok) {
                const data = await res.json()
                toast.error(data.error || 'Invoice not found. Please check your details.')
                return
            }
            const data = await res.json()
            if (data.trackingCode) {
                router.push(`/tracking/${data.trackingCode}`)
            } else {
                toast.info('Your order is confirmed but delivery has not started yet. Check back soon!')
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                        <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Track Your Delivery</h1>
                    <p className="text-muted-foreground text-sm">
                        Enter your invoice number to track your order status in real-time.
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-card border rounded-2xl p-6 shadow-lg space-y-5">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Invoice Number</Label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="invoiceNumber"
                                    className="pl-10 font-mono"
                                    placeholder="e.g. INV-12345678"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value.toUpperCase())}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Email Address <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(for verification)</span>
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-10"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-bold py-6" disabled={isSearching}>
                            {isSearching ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
                            ) : (
                                <>Track Order <ArrowRight className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                        <div className="relative flex justify-center"><span className="bg-card px-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">or</span></div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Have an account?{' '}
                        <a href="/auth/login" className="text-primary font-semibold hover:underline">
                            Log in for full order history →
                        </a>
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                        { label: 'Real-time Updates', icon: '🔴' },
                        { label: 'Worker GPS Tracking', icon: '📍' },
                        { label: 'ETA Estimates', icon: '⏱️' },
                    ].map(item => (
                        <div key={item.label} className="bg-card border rounded-xl p-3 space-y-1">
                            <div className="text-2xl">{item.icon}</div>
                            <p className="text-[10px] font-bold text-muted-foreground leading-tight">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
