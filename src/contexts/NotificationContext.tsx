"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface NotificationContextType {
    unreadMessagesCount: number
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

    const fetchUnreadCount = async () => {
        if (!user) {
            setUnreadMessagesCount(0)
            return
        }

        try {
            const token = localStorage.getItem('token')
            if (!token) return

            const res = await fetch('/api/messages/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setUnreadMessagesCount(data.count)
            }
        } catch (error) {
            console.error('Failed to fetch unread count', error)
        }
    }

    useEffect(() => {
        fetchUnreadCount()
        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000)
        return () => clearInterval(interval)
    }, [user])

    return (
        <NotificationContext.Provider value={{
            unreadMessagesCount,
            refreshNotifications: fetchUnreadCount
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
