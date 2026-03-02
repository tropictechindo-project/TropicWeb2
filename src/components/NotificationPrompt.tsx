'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationPrompt() {
    const [isOpen, setIsOpen] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')

    useEffect(() => {
        if (!('Notification' in window)) {
            setPermissionStatus('unsupported')
            return
        }

        setPermissionStatus(Notification.permission)

        if (Notification.permission === 'default') {
            // Check if we've already asked and they said "Not Now" (using simple flag)
            const hasAsked = localStorage.getItem('notification_prompt_shown')

            if (!hasAsked) {
                // Show prompt after 5 minutes of browsing
                const timer = setTimeout(() => {
                    setIsOpen(true)
                }, 300000)

                return () => clearTimeout(timer)
            }
        }
    }, [])

    const handleAllow = async () => {
        if (!('Notification' in window)) return

        try {
            const permission = await Notification.requestPermission()
            setPermissionStatus(permission)
            localStorage.setItem('notification_prompt_shown', 'true')
            setIsOpen(false)

            if (permission === 'granted') {
                toast.success('Notifications enabled! You will receive delivery updates here.')
                // Ideally, here you'd also register a Service Worker for Push notifications
                new Notification("Tropic Tech", {
                    body: "Notifications are now active. Ready for delivery updates!",
                    icon: "/images/Logo.webp"
                })
            } else {
                toast.error('Notifications blocked. You can enable them in your browser settings later.')
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            setIsOpen(false)
        }
    }

    const handleDecline = () => {
        localStorage.setItem('notification_prompt_shown', 'true')
        setIsOpen(false)
    }

    // Trigger on custom event (e.g., when an order is placed)
    useEffect(() => {
        const handleTrigger = () => {
            if (Notification.permission === 'default') {
                setIsOpen(true)
            }
        }
        window.addEventListener('trigger-notification-prompt', handleTrigger)
        return () => window.removeEventListener('trigger-notification-prompt', handleTrigger)
    }, [])

    if (permissionStatus === 'unsupported' || permissionStatus === 'granted') return null

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black uppercase tracking-tighter">
                        Stay Updated?
                    </DialogTitle>
                    <DialogDescription className="text-center font-medium">
                        Enable device notifications to receive real-time updates on your delivery, worker arrival, and workstation setup status.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            We only send essential updates about your active rentals and security alerts. No spam, ever.
                        </p>
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleDecline}
                        className="flex-1 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Not Now
                    </Button>
                    <Button
                        onClick={handleAllow}
                        className="flex-1 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                    >
                        Enable Notifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
