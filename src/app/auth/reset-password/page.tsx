'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }), // Token no longer needed, API uses session
            })

            if (response.ok) {
                toast.success('Password reset successful! Please log in.')
                setTimeout(() => router.push('/auth/login'), 2000)
            } else {
                const data = await response.json()
                // If it's a 401, the Supabase link probably expired
                if (response.status === 401) {
                    toast.error('Your reset link has expired. Please request a new one.')
                    setTimeout(() => router.push('/auth/forgot-password'), 2000)
                } else {
                    toast.error(data.error || 'Failed to reset password')
                }
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <Card className="w-full max-w-md relative overflow-hidden shadow-2xl border-primary/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <CardHeader className="text-center pt-10 relative z-10">
                    <CardTitle className="text-3xl font-black text-primary tracking-tighter uppercase italic">Tropic <span className="text-foreground">Tech</span></CardTitle>
                    <CardDescription className="text-sm font-semibold tracking-widest uppercase">Set New Password</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    disabled={isLoading}
                                    className="pr-10 bg-background/50 border-primary/20 focus-visible:ring-primary/30"
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={isLoading}
                                className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-sm font-bold" disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

