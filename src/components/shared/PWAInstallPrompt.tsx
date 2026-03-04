"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // 1. Android / Chrome: Listen for the native install prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show only if they haven't dismissed it recently
            if (!localStorage.getItem("pwa_dismissed")) {
                setShowPrompt(true)
            }
        }
        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

        // 2. iOS Safari detection
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone

        if (isIosDevice && !isStandalone && !localStorage.getItem("pwa_dismissed")) {
            setIsIOS(true)
            setShowPrompt(true)
        }

        // 3. Hide if successfully installed
        const handleAppInstalled = () => {
            setShowPrompt(false)
            setDeferredPrompt(null)
            localStorage.setItem("pwa_dismissed", "true")
        }
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowPrompt(false)
            localStorage.setItem("pwa_dismissed", "true")
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem("pwa_dismissed", "true") // don't ask again
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-6 left-4 right-4 md:bottom-8 md:right-8 md:left-auto z-[999] animate-in slide-in-from-bottom-5 duration-700">
            <div className="mx-auto max-w-sm bg-background/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-2xl z-10 border border-primary/10">
                    <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 z-10">
                    <h4 className="font-black text-sm tracking-tight uppercase">Get the App</h4>
                    {isIOS ? (
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1 leading-tight">
                            Tap <span className="text-primary italic">Share</span> +
                            <span className="text-primary ml-1">Add to Home</span>
                        </p>
                    ) : (
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1 leading-tight">
                            Install for the full experience.
                        </p>
                    )}
                </div>
                {!isIOS && (
                    <div className="z-10">
                        <button
                            onClick={handleInstallClick}
                            className="bg-primary text-primary-foreground text-[10px] font-black py-2.5 px-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                        >
                            INSTALL
                        </button>
                    </div>
                )}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-3 text-muted-foreground/50 hover:text-foreground transition-colors p-1 z-10"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
