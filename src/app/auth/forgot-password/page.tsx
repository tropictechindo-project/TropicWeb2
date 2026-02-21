'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { X, ArrowLeft } from 'lucide-react'
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
                <Card className="w-full max-w-md text-center">
                    <CardHeader className="pt-10">
                        <CardTitle className="text-3xl font-bold text-primary">Tropic Tech</CardTitle>
                        <CardDescription>Check Your Email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            If an account exists with <strong>{email}</strong>, we've sent a instructions to reset your password.
                        </p>
                        <Button onClick={() => router.push('/auth/login')} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <Card className="w-full max-w-md relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/auth/login')}
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-bold text-primary">Tropic Tech</CardTitle>
                    <CardDescription>Reset Your Password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link href="/auth/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                            <ArrowLeft className="h-3 w-3" /> Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
