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
import { MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'

export function LocationPrompt() {
    const [isOpen, setIsOpen] = useState(false)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    useEffect(() => {
        // Check if we already have permission or denied it
        const storedPermission = localStorage.getItem('location_permission')
        if (storedPermission === 'granted') {
            setHasPermission(true)
            updateLocation()
        } else if (storedPermission === 'denied') {
            setHasPermission(false)
        } else {
            // Set a timer to show the prompt after 5 minutes (300,000 ms)
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 300000)

            return () => clearTimeout(timer)
        }
    }, [])

    const updateLocation = () => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                localStorage.setItem('user_lat', latitude.toString())
                localStorage.setItem('user_lng', longitude.toString())
                localStorage.setItem('location_timestamp', Date.now().toString())
                console.log('📍 Location updated:', latitude, longitude)
            },
            (error) => {
                console.error('Error getting location:', error)
            },
            { enableHighAccuracy: true }
        )
    }

    const handleAllow = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            setIsOpen(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                localStorage.setItem('location_permission', 'granted')
                localStorage.setItem('user_lat', latitude.toString())
                localStorage.setItem('user_lng', longitude.toString())
                localStorage.setItem('location_timestamp', Date.now().toString())
                setHasPermission(true)
                setIsOpen(false)
                toast.success('Location access granted. We can now provide better delivery tracking.')
            },
            (error) => {
                localStorage.setItem('location_permission', 'denied')
                setHasPermission(false)
                setIsOpen(false)
                toast.error('Location access denied. Manual address entry will be required.')
            }
        )
    }

    const handleDecline = () => {
        localStorage.setItem('location_permission', 'denied')
        setHasPermission(false)
        setIsOpen(false)
    }

    // Also expose a way to trigger this manually (e.g., at checkout)
    useEffect(() => {
        const handleTrigger = () => setIsOpen(true)
        window.addEventListener('trigger-location-prompt', handleTrigger)
        return () => window.removeEventListener('trigger-location-prompt', handleTrigger)
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black uppercase tracking-tighter">
                        Enable Precise Delivery?
                    </DialogTitle>
                    <DialogDescription className="text-center font-medium">
                        Tropic Tech uses your location to provide point-to-point tracking and accurate delivery times across Bali.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                        <Navigation className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your coordinates will be shared with the delivery worker to ensure your workstation arrives at the exact spot.
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
                        Allow Location Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
