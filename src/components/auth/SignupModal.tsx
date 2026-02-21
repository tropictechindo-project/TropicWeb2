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
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                        {/* Password Strength Bar */}
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
                <div className="text-center text-sm">
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
