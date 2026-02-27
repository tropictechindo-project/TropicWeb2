'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { X, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const COUNTRY_CODES = [
  { code: '+62', country: 'ID' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+65', country: 'SG' },
  { code: '+60', country: 'MY' },
  { code: '+66', country: 'TH' },
  { code: '+63', country: 'PH' },
  { code: '+84', country: 'VN' },
  { code: '+91', country: 'IN' },
  { code: '+86', country: 'CN' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+33', country: 'FR' },
  { code: '+49', country: 'DE' },
  { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' },
  { code: '+31', country: 'NL' },
  { code: '+7', country: 'RU/KZ' },
  { code: '+971', country: 'AE' },
  { code: '+966', country: 'SA' },
]

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+62')
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, whatsapp: `${countryCode}${whatsappNumber}`, password, baliAddress, mapsAddressLink }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Account created successfully! Please check your email to verify.')
        // Don't auto-redirect immediately so they can read the message, or redirect with a slight delay
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12">
      <Card className="w-full max-w-lg relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/')}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="text-center pt-10">
          <CardTitle className="text-3xl font-bold text-primary">Tropic Tech</CardTitle>
          <CardDescription>{t('signUp')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ====== GOOGLE SIGN UP BUTTON - TOP ====== */}
          <button
            type="button"
            id="google-signup-btn"
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
              <span className="bg-card px-3 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          {/* ====== EMAIL FORM ====== */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="relative w-[110px]">
                  <Input
                    list="country-codes"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    placeholder="+62"
                    className="w-full bg-background/50 pr-6" // add some padding for a visual dropdown indicator if you wanted one
                  />
                  <datalist id="country-codes">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.country}
                      </option>
                    ))}
                  </datalist>
                </div>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))} // only allow digits
                  placeholder="812345678"
                  required
                  disabled={isLoading}
                  className="flex-1"
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
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <div className="flex gap-1 h-1.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                      ? passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                      : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {passwordStrength <= 2 && password.length > 0 ? 'Weak' : passwordStrength <= 3 && password.length > 0 ? 'Medium' : passwordStrength > 3 ? 'Strong' : ''}
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
              <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree with the <Link href="/policies" className="text-primary hover:underline">Policies</Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : t('signUp')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm border-t border-border/50 pt-4">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-bold">
              {t('login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
