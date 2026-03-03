'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Time thresholds in minutes
const TIME_THRESHOLDS = [0, 5, 10, 30, 60, 180, 360, 720]

export default function SystemTimeSync() {
    const pathname = usePathname()
    const { isAuthenticated } = useAuth()

    const [isVisible, setIsVisible] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [sessionStart, setSessionStart] = useState<number | null>(null)
    const [lastTriggeredThreshold, setLastTriggeredThreshold] = useState<number | null>(null)

    // Only activate on dashboards
    const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')

    useEffect(() => {
        if (!isAuthenticated || !isDashboard) {
            setIsVisible(false)
            return
        }

        // Initialize session start time if not set
        if (!sessionStart) {
            setSessionStart(Date.now())
        }

        const intervalId = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)

            if (sessionStart) {
                const elapsedMinutes = Math.floor((now.getTime() - sessionStart) / 60000)

                // Check if we hit a threshold that we haven't triggered yet
                const currentThreshold = [...TIME_THRESHOLDS].reverse().find(t => elapsedMinutes >= t)

                if (currentThreshold !== undefined && currentThreshold !== lastTriggeredThreshold) {
                    setLastTriggeredThreshold(currentThreshold)
                    triggerSyncDisplay()
                }
            }
        }, 1000) // Check every second to keep the clock accurate when displayed

        return () => clearInterval(intervalId)
    }, [isAuthenticated, isDashboard, sessionStart, lastTriggeredThreshold])

    const triggerSyncDisplay = () => {
        setIsVisible(true)
        // Hide after 7 seconds
        setTimeout(() => {
            setIsVisible(false)
        }, 7000)
    }

    if (!isDashboard || !isAuthenticated) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="z-[200] flex items-center gap-2 bg-slate-900/95 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-700/50 pointer-events-none shrink-0"
                >
                    <Clock className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-semibold tracking-wide font-mono">
                        {currentTime.toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                    <span className="text-[10px] text-primary/80 uppercase font-bold tracking-wider ml-1">Sync</span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
