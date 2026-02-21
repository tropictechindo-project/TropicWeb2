import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface SiteSetting {
    key: string
    value: any
    section: string
}

export function useSiteSettings() {
    const [settings, setSettings] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')

            if (error) {
                console.error('Error fetching settings (Supabase):', JSON.stringify(error, null, 2))
                return
            }

            if (data) {
                const settingsMap = data.reduce((acc, curr) => {
                    acc[curr.key] = curr.value
                    return acc
                }, {} as Record<string, any>)
                setSettings(settingsMap)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()

        // Subscribe to changes
        const channel = supabase
            .channel('site_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_settings',
                },
                () => {
                    fetchSettings()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const getSetting = (key: string, defaultValue: any) => {
        return settings[key] !== undefined ? settings[key] : defaultValue
    }

    const updateSetting = async (key: string, value: any, section: string) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                console.error('No auth token found')
                return false
            }

            const response = await fetch('/api/admin/site-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value, section })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || response.statusText)
            }

            // Optimistic update
            setSettings(prev => ({ ...prev, [key]: value }))
            return true
        } catch (error) {
            console.error('Error updating setting:', error)
            return false
        }
    }

    return {
        settings,
        loading,
        getSetting,
        updateSetting,
        refresh: fetchSettings
    }
}
