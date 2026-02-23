'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { X, CheckCircle2 } from 'lucide-react'

export default function CompleteProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <CompleteProfileContent />
        </Suspense>
    )
}

function CompleteProfileContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLanguage()

    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [baliAddress, setBaliAddress] = useState('')
    const [mapsAddressLink, setMapsAddressLink] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const emailParam = searchParams.get('email')
        const nameParam = searchParams.get('name')
        if (emailParam) setEmail(emailParam)
        if (nameParam) setFullName(nameParam)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/complete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    whatsapp,
                    baliAddress,
                    mapsAddressLink,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem('token', data.token)
                toast.success('Registration complete! Welcome to Tropic Tech.')
                setTimeout(() => {
                    window.location.href = '/'
                }, 1500)
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to complete profile')
            }
        } catch (error) {
            toast.error('Failed to complete profile')
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12">
            <Card className="w-full max-w-lg relative border-primary/20 shadow-2xl">
                <CardHeader className="text-center pt-10">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Almost <span className="text-primary italic">There</span></CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        We've linked your Google account. Just a few more details to finalize your rental access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Full Name</Label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    disabled={isLoading}
                                    className="bg-muted/30 border-primary/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="bg-muted/50 border-none opacity-60 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">WhatsApp *</Label>
                            <Input
                                type="tel"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="+62 812-3456-7890"
                                required
                                disabled={isLoading}
                                className="bg-muted/30 border-primary/10"
                            />
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter italic">Required for logistics and order updates.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Bali Address *</Label>
                            <Textarea
                                value={baliAddress}
                                onChange={(e) => setBaliAddress(e.target.value)}
                                placeholder="Where should we deliver your items?"
                                rows={3}
                                required
                                disabled={isLoading}
                                className="bg-muted/30 border-primary/10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-widest opacity-70">Google Maps Link</Label>
                            <Input
                                type="url"
                                value={mapsAddressLink}
                                onChange={(e) => setMapsAddressLink(e.target.value)}
                                placeholder="https://maps.google.com/..."
                                disabled={isLoading}
                                className="bg-muted/30 border-primary/10"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 font-black uppercase tracking-widest text-xs italic shadow-lg shadow-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Complete Registration'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
