"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

interface SpiNotification {
    id: string
    type: string
    title: string
    message: string
    link?: string
    createdAt: string
}

interface NotificationContextType {
    unreadMessagesCount: number
    unreadOrdersCount: number
    unreadDeliveriesCount: number
    spiNotifications: SpiNotification[]
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
    const [unreadOrdersCount, setUnreadOrdersCount] = useState(0)
    const [unreadDeliveriesCount, setUnreadDeliveriesCount] = useState(0)
    const [prevUnreadOrders, setPrevUnreadOrders] = useState(0)
    const [prevNotificationsCount, setPrevNotificationsCount] = useState(0)
    const [spiNotifications, setSpiNotifications] = useState<SpiNotification[]>([])

    useEffect(() => {
        if (unreadOrdersCount > prevUnreadOrders) {
            // Find the most recent New Order SPI notification
            const latestSpi = spiNotifications[0]
            if (latestSpi && latestSpi.title === 'New Order Received') {
                toast.success(latestSpi.message, { duration: 10000 })
            } else {
                toast.success("New order arrived!", { duration: 5000 })
            }
        }
        setPrevUnreadOrders(unreadOrdersCount)
    }, [unreadOrdersCount, spiNotifications])

    useEffect(() => {
        if (spiNotifications.length > prevNotificationsCount) {
             const latestSpi = spiNotifications[0]
             if (latestSpi && latestSpi.title !== 'New Order Received') { // Avoid duplicate toasts
                 toast.info(`${latestSpi.title}: ${latestSpi.message}`, { duration: 8000 })
             }
        }
        setPrevNotificationsCount(spiNotifications.length)
    }, [spiNotifications])

    const isFetchingRef = React.useRef(false)
    
    const fetchUnreadCounts = async () => {
        if (!user || isFetchingRef.current) {
            if (!user) {
                setUnreadMessagesCount(0)
                setUnreadOrdersCount(0)
                setUnreadDeliveriesCount(0)
                setSpiNotifications([])
            }
            return
        }
        
        isFetchingRef.current = true
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            // 1. Fetch Chat Unread Count
            const chatRes = await fetch('/api/messages/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const chatData = await chatRes.json()
            if (chatData.success) {
                setUnreadMessagesCount(chatData.count)
            }

            // 2. Fetch Dashboard Badges (Orders/Deliveries) if Admin/Operator
            if (['ADMIN', 'OPERATOR'].includes(user.role)) {
                const badgesRes = await fetch('/api/admin/notifications/unread-counts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const badgesData = await badgesRes.json()
                if (badgesData.success) {
                    setUnreadOrdersCount(badgesData.unreadOrders)
                    setUnreadDeliveriesCount(badgesData.unreadDeliveries)
                }
            }

            // 3. Fetch SPI Notifications (Global Alerts)
            const spiRes = await fetch('/api/spi/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const spiData = await spiRes.json()
            if (Array.isArray(spiData)) {
                setSpiNotifications(spiData)
            }

        } catch (error: any) {
            // Silence background polling interval failures
        } finally {
            isFetchingRef.current = false
        }
    }

    useEffect(() => {
        fetchUnreadCounts()
        // Poll every 15 seconds for snappier feedback
        const interval = setInterval(fetchUnreadCounts, 15000)
        return () => clearInterval(interval)
    }, [user])

    return (
        <NotificationContext.Provider value={{
            unreadMessagesCount,
            unreadOrdersCount,
            unreadDeliveriesCount,
            spiNotifications,
            refreshNotifications: fetchUnreadCounts
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotification() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
