'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { realtimePoller } from '@/lib/realtime'
import { useRouter } from 'next/navigation'
import { X, ExternalLink, Bell, User as UserIcon, Truck, ShoppingCart } from 'lucide-react'

interface SpiNotification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    createdAt: string
}

export function StickyPanelInfo() {
    const [notifications, setNotifications] = useState<SpiNotification[]>([])
    const router = useRouter()

    useEffect(() => {
        // Start polling for SPI notifications
        realtimePoller.pollSpiNotifications()

        // Listen for updates
        const originalOnUpdate = (realtimePoller as any).config.onUpdate
            ; (realtimePoller as any).config.onUpdate = (data: any) => {
                if (originalOnUpdate) originalOnUpdate(data)
                if (data.spiNotifications) {
                    setNotifications(data.spiNotifications)
                }
            }

        return () => {
            realtimePoller.stop()
                ; (realtimePoller as any).config.onUpdate = originalOnUpdate
        }
    }, [])

    const handleDismiss = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setNotifications(prev => prev.filter(n => n.id !== id))

        // Mark as read in DB
        try {
            await fetch(`/api/spi/notifications/${id}/read`, { method: 'POST' })
        } catch (e) {
            console.error('Failed to mark read', e)
        }
    }

    const handleClick = (link?: string) => {
        if (link) {
            router.push(link)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_USER': return <UserIcon className="w-4 h-4 text-blue-400" />
            case 'ORDER_CREATED': return <ShoppingCart className="w-4 h-4 text-green-400" />
            case 'DELIVERY_UPDATE': return <Truck className="w-4 h-4 text-orange-400" />
            case 'AI_MASTER_ALERT': return <Bell className="w-4 h-4 text-purple-400" />
            default: return <Bell className="w-4 h-4 text-gray-400" />
        }
    }

    if (notifications.length === 0) return null

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-sm w-full px-4">
            <AnimatePresence>
                {notifications.slice(0, 3).map((notif, i) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => handleClick(notif.link)}
                        className={`
                w-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50
                rounded-xl shadow-2xl overflow-hidden cursor-pointer
                hover:bg-slate-800/90 transition-colors group
                ${i === 0 ? 'scale-100' : i === 1 ? 'scale-[0.98] -mt-1 opacity-90' : 'scale-[0.95] -mt-2 opacity-80 z-[-1]'}
                        `}
                        style={{ zIndex: 50 - i }}
                    >
                        <div className="p-3 flex items-start gap-3 relative">
                            <div className="mt-0.5 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <h4 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-2">
                                    {notif.title}
                                    {notif.link && <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </h4>
                                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                                    {notif.message}
                                </p>
                            </div>
                            <button
                                onClick={(e) => handleDismiss(notif.id, e)}
                                className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        {/* Dynamic Island style connection blob indicator */}
                        {i === 0 && Array.isArray(notifications) && notifications.length > 1 && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-700/50 rounded-full blur-[1px]"></div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div >
    )
}
