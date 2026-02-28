'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (response.ok) {
                setIsSubmitted(true)
                toast.success('Reset link sent to your email!')
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to send reset link')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
                <Card className="w-full max-w-md relative overflow-hidden shadow-2xl border-primary/10 text-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 z-50 hover:bg-transparent text-muted-foreground hover:text-foreground"
                        onClick={() => router.push('/')}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                    <CardHeader className="pt-10 relative z-10">
                        <CardTitle className="text-3xl font-black text-primary tracking-tighter uppercase italic">Tropic <span className="text-foreground">Tech</span></CardTitle>
                        <CardDescription className="text-sm font-semibold tracking-widest uppercase">Check Your Email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <p className="text-muted-foreground text-sm">
                            If an account exists with <strong className="text-foreground">{email}</strong>, we've sent instructions to reset your password.
                        </p>
                        <Button onClick={() => router.push('/auth/login')} className="w-full h-12 text-sm font-bold">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <Card className="w-full max-w-md relative overflow-hidden shadow-2xl border-primary/10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-50 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/')}
                >
                    <X className="h-5 w-5" />
                </Button>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <CardHeader className="text-center pt-10 relative z-10">
                    <CardTitle className="text-3xl font-black text-primary tracking-tighter uppercase italic">Tropic <span className="text-foreground">Tech</span></CardTitle>
                    <CardDescription className="text-sm font-semibold tracking-widest uppercase">Reset Your Password</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                disabled={isLoading}
                                className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-sm font-bold" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link href="/auth/login" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft className="h-3 w-3" /> Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

