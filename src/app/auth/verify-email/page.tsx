'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function VerifyEmailContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your email address...')
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Invalid or missing verification token.')
            return
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })

                if (response.ok) {
                    setStatus('success')
                    setMessage('Your email has been successfully verified! You can now log in.')
                    toast.success('Email verified successfully')
                } else {
                    const data = await response.json()
                    setStatus('error')
                    setMessage(data.error || 'Failed to verify email.')
                }
            } catch (error) {
                setStatus('error')
                setMessage('An error occurred during verification. Please try again later.')
            }
        }

        verifyEmail()
    }, [token])

    return (
        <div className="text-center space-y-6">
            <p className={`text-lg ${status === 'error' ? 'text-destructive' : status === 'success' ? 'text-green-600' : 'text-muted-foreground'}`}>
                {message}
            </p>
            {status !== 'loading' && (
                <Button onClick={() => router.push('/auth/login')} className="w-full">
                    Go to Login
                </Button>
            )}
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-bold text-primary">Tropic Tech</CardTitle>
                    <CardDescription>Email Verification</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Loading verification...</div>}>
                        <VerifyEmailContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
