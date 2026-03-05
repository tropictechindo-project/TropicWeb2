"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

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
    const [spiNotifications, setSpiNotifications] = useState<SpiNotification[]>([])

    const fetchUnreadCounts = async () => {
        if (!user) {
            setUnreadMessagesCount(0)
            setUnreadOrdersCount(0)
            setUnreadDeliveriesCount(0)
            setSpiNotifications([])
            return
        }

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

        } catch (error) {
            console.error('Failed to fetch notification counts', error)
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
