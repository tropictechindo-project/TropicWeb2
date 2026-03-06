'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onSwitchToSignup: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()
    const { t } = useLanguage()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const success = await login(email, password)

        if (success) {
            toast.success('Login successful!')
            onClose()
            router.refresh() // Ensure header updates with auth state
        } else {
            toast.error('Invalid email or password')
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold text-primary tracking-tighter uppercase italic">Tropic <span className="text-foreground">Tech</span></DialogTitle>
                    <DialogDescription className="text-center font-semibold tracking-widest uppercase text-xs">{t('login')}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Account</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                            disabled={isLoading}
                            className="bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
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
                        <div className="flex justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                onClick={onClose}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 text-sm font-bold uppercase tracking-widest"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : t('login')}
                    </Button>
                </form>

                <div className="text-center text-sm border-t border-border/50 pt-4">
                    <span className="text-muted-foreground font-medium">Don't have an account? </span>
                    <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="text-primary hover:underline font-bold italic uppercase tracking-tighter"
                    >
                        {t('signUp')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
