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

    console.log('--- useSiteSettings Initializing ---');

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
                console.log('--- useSiteSettings Data Received ---', data.length, 'keys');
                const settingsMap = data.reduce((acc, curr) => {
                    let val = curr.value;
                    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
                        try {
                            val = JSON.parse(val);
                        } catch (e) {
                            console.warn(`Failed to parse JSON for key ${curr.key}:`, e);
                        }
                    }
                    acc[curr.key] = val
                    return acc
                }, {} as Record<string, any>)
                console.log('--- useSiteSettings Map ---', Object.keys(settingsMap));
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
