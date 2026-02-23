'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { countries, normalizeWhatsApp } from '@/lib/utils/whatsapp'

interface SignupModalProps {
    isOpen: boolean
    onClose: () => void
    onSwitchToLogin: () => void
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [whatsappCode, setWhatsappCode] = useState('+62')
    const [whatsappNumber, setWhatsappNumber] = useState('')
    const [password, setPassword] = useState('')
    const [baliAddress, setBaliAddress] = useState('')
    const [mapsAddressLink, setMapsAddressLink] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

    const router = useRouter()
    const { t } = useLanguage()

    // Simple password strength calculation
    const getPasswordStrength = (pass: string) => {
        let strength = 0
        if (pass.length > 5) strength += 1
        if (pass.length > 8) strength += 1
        if (/[A-Z]/.test(pass)) strength += 1
        if (/[0-9]/.test(pass)) strength += 1
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1
        return strength
    }

    const passwordStrength = getPasswordStrength(password)

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true)
        try {
            const { supabase } = await import('@/lib/supabase')
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/api/auth/callback` },
            })
            if (error) throw error
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign up with Google')
            setIsGoogleLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!agreedToPolicy) {
            toast.error('You must agree to our policies')
            return
        }

        setIsLoading(true)

        try {
            const normalizedWhatsapp = normalizeWhatsApp(whatsappCode, whatsappNumber)

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    whatsapp: normalizedWhatsapp,
                    password,
                    baliAddress,
                    mapsAddressLink,
                }),
            })

            if (response.ok) {
                toast.success('Account created successfully! Please login.')
                onSwitchToLogin() // Switch to login modal instead of page redirect
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to create account')
            }
        } catch (error) {
            toast.error('Failed to create account')
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold text-primary">Tropic Tech</DialogTitle>
                    <DialogDescription className="text-center">{t('signUp')}</DialogDescription>
                </DialogHeader>

                {/* ====== GOOGLE SIGN UP BUTTON ====== */}
                <button
                    type="button"
                    id="google-signup-modal-btn"
                    onClick={handleGoogleSignUp}
                    disabled={isGoogleLoading}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-white border-2 border-primary rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
                >
                    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="font-black text-sm text-black">
                        {isGoogleLoading ? 'Connecting...' : 'Sign up with Google Account'}
                    </span>
                </button>

                {/* ====== DIVIDER ====== */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted-foreground/30" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                        <div className="flex gap-2">
                            <Select
                                value={whatsappCode}
                                onValueChange={setWhatsappCode}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((c) => (
                                        <SelectItem key={c.code + c.name} value={c.code}>
                                            <span className="flex items-center gap-2">
                                                <span>{c.flag}</span>
                                                <span>{c.code}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="whatsapp"
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="812345678"
                                className="flex-1"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a strong password"
                                required
                                disabled={isLoading}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <div className="flex gap-1 h-1.5 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-full flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                                        ? passwordStrength <= 2
                                            ? 'bg-red-500'
                                            : passwordStrength <= 3
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                        : 'bg-muted'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                            {passwordStrength <= 2 && password.length > 0 ? 'Weak' :
                                passwordStrength <= 3 && password.length > 0 ? 'Medium' :
                                    passwordStrength > 3 ? 'Strong' : ''}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baliAddress">Bali Address</Label>
                        <Textarea
                            id="baliAddress"
                            value={baliAddress}
                            onChange={(e) => setBaliAddress(e.target.value)}
                            placeholder="Your address in Bali..."
                            rows={2}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mapsAddressLink">Google Maps Address Link</Label>
                        <Input
                            id="mapsAddressLink"
                            type="url"
                            value={mapsAddressLink}
                            onChange={(e) => setMapsAddressLink(e.target.value)}
                            placeholder="https://maps.google.com/..."
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="terms"
                            checked={agreedToPolicy}
                            onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I agree with the <Link href="/policies" className="text-primary hover:underline" onClick={onClose}>Policies</Link>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account...' : t('signUp')}
                    </Button>
                </form>

                <div className="text-center text-sm pt-2">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-primary hover:underline font-medium"
                    >
                        {t('login')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
