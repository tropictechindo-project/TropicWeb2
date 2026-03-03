'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

function ClickLoaderContent() {
    const [isLoading, setIsLoading] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // 1. Listen for global clicks
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            // Only trigger if clicking a button, link, or an element inside them
            const isClickable = target.closest('a') || target.closest('button') || target.closest('[role="button"]')

            if (isClickable) {
                setIsLoading(true)
                // Auto-hide after 3 seconds in case it's just a non-navigational click (like an API save)
                // so the user isn't stuck with an endless spinner.
                setTimeout(() => {
                    setIsLoading(false)
                }, 3000)
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    // 2. Shut off the loader instantly if the route successfully changes (navigation complete)
    useEffect(() => {
        setIsLoading(false)
    }, [pathname, searchParams])

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="z-[200] bg-slate-900/80 backdrop-blur-md rounded-full shadow-lg border border-slate-700/50 p-2 pointer-events-none flex items-center justify-center shrink-0"
                >
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function GlobalClickLoader() {
    return (
        <Suspense fallback={null}>
            <ClickLoaderContent />
        </Suspense>
    )
}
