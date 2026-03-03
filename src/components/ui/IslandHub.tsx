'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import GlobalClickLoader from './GlobalClickLoader'
import SystemTimeSync from './SystemTimeSync'

export function IslandHub() {
    const [pos, setPos] = useState({ top: 16, left: 16, height: 32 })
    const [hasHeader, setHasHeader] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const updatePos = () => {
            const logo = document.getElementById('main-header-logo')
            if (logo) {
                const rect = logo.getBoundingClientRect()
                // If logo is clearly visible
                if (rect.width > 0 && rect.height > 0) {
                    setPos({ top: rect.top, left: rect.right, height: rect.height })
                    setHasHeader(true)
                } else {
                    setHasHeader(false)
                }
            } else {
                setHasHeader(false)
            }
        }

        // Initial check and short timeout to allow DOM to settle
        updatePos()
        const timeout = setTimeout(updatePos, 100)

        // Polling gracefully catches dynamic mounting/unmounting
        const interval = setInterval(updatePos, 1000)

        window.addEventListener('resize', updatePos)
        window.addEventListener('scroll', updatePos) // In case header shrinks on scroll

        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
            window.removeEventListener('resize', updatePos)
            window.removeEventListener('scroll', updatePos)
        }
    }, [pathname])

    return (
        <div
            className="fixed z-[200] flex items-center gap-3 pointer-events-none transition-all duration-300"
            style={
                hasHeader
                    ? { top: pos.top + (pos.height / 2) - 16, left: pos.left + 16 }
                    : { top: 16, left: '50%', transform: 'translateX(-50%)' }
            }
        >
            <SystemTimeSync />
            <GlobalClickLoader />
        </div>
    )
}
