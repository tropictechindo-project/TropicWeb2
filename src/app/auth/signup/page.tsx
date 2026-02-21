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

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          whatsapp,
          password,
          baliAddress,
          mapsAddressLink,
        }),
      })

      if (response.ok) {
        toast.success('Account created successfully! Please login.')
        router.push('/auth/login')
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
        <CardContent>
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
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+62..."
                required
                disabled={isLoading}
              />
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
                I agree with the <Link href="/policies" className="text-primary hover:underline">Policies</Link>
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
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              {t('login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
