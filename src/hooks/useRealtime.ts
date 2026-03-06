'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/contexts/AuthContext'

export function useRealtime() {
    const queryClient = useQueryClient()
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) return

        // 1. Subscribe to Messages
        const messageChannel = supabase
            .channel('messages-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    console.log('Realtime Message received:', payload)
                    queryClient.invalidateQueries({ queryKey: ['messages'] })
                }
            )
            .subscribe()

        // 2. Subscribe to Group Messages
        const groupMessageChannel = supabase
            .channel('group-messages-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'group_messages' },
                (payload) => {
                    console.log('Realtime Group Message received:', payload)
                    queryClient.invalidateQueries({ queryKey: ['group-messages'] })
                }
            )
            .subscribe()

        // 3. Subscribe to System Notifications
        const notificationChannel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'system_notifications' },
                (payload) => {
                    console.log('Realtime Notification received:', payload)
                    queryClient.invalidateQueries({ queryKey: ['notifications'] })
                }
            )
            .subscribe()

        // 4. Cleanup on unmount
        return () => {
            supabase.removeChannel(messageChannel)
            supabase.removeChannel(groupMessageChannel)
            supabase.removeChannel(notificationChannel)
        }
    }, [queryClient, isAuthenticated])
}
