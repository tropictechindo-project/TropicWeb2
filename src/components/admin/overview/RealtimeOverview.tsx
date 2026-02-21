'use client'

import { useState, useEffect } from 'react'
import { StatCards } from './StatCards'
import { InfoCenter } from './InfoCenter'
import { RealtimePoller } from '@/lib/realtime'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RealtimeOverview({ initialData, children, sidePanel }: { initialData: any, children: React.ReactNode, sidePanel?: React.ReactNode }) {
    const [stats, setStats] = useState(initialData.cards)
    const [notifications, setNotifications] = useState(initialData.notifications)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        const poller = new RealtimePoller({
            interval: 30000, // Sync every 30 seconds for admin
            onUpdate: (data) => {
                if (data.adminStats) {
                    setStats(data.adminStats.stats)
                    setNotifications(data.adminStats.notifications)
                }
            }
        })

        const token = localStorage.getItem('token')
        if (token) {
            poller.pollAdminData(token)

            // Automation Triggers (Lazy Schedule)
            // Check if we need to run 7AM or 7PM jobs
            // In a real app, this should be done by Vercel Cron or a dedicated worker.
            // Here we use the admin dashboard as a trigger.
            const now = new Date()
            const baliHour = (now.getUTCHours() + 8) % 24 // Bali is UTC+8

            // Run Currency Update if it's after 7 AM Bali Time
            if (baliHour >= 7 && baliHour < 19) { // Window: 7 AM - 7 PM
                // We should check if it ran today, but for now we'll just hit the endpoint 
                // and let the endpoint logic handles idempotency or we accept redundant updates (it's cheap)
                // Ideally we should check a local storage flag to avoid spamming on every refresh
                const lastCurrencyRun = localStorage.getItem('last_currency_run')
                const today = new Date().toDateString()

                if (lastCurrencyRun !== today) {
                    fetch('/api/cron/currency').then(() => {
                        localStorage.setItem('last_currency_run', today)
                        console.log('Triggered 7AM Currency Update')
                    })
                }
            }

            // Run Smart Check if it's after 7 PM Bali Time
            if (baliHour >= 19 || baliHour < 7) { // Window: 7 PM - 7 AM
                const lastSmartCheck = localStorage.getItem('last_smart_check')
                const today = new Date().toDateString()

                if (lastSmartCheck !== today) {
                    fetch('/api/cron/smart-check').then(() => {
                        localStorage.setItem('last_smart_check', today)
                        console.log('Triggered 7PM Smart Check')
                    })
                }
            }
        }

        return () => poller.stop()
    }, [])

    const manualRefresh = async () => {
        setIsRefreshing(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStats(data.stats)
                setNotifications(data.notifications)
            }
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Area with Live Sync Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black tracking-tight uppercase">Dashboard Overview</h1>
                    <p className="text-muted-foreground font-medium italic">Command Center</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-black uppercase tracking-widest gap-2 opacity-50 hover:opacity-100 self-start md:self-end"
                    onClick={manualRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Live Sync Active'}
                </Button>
            </div>

            {stats.unresolvedConflicts > 0 && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 animate-pulse">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Critical Inventory Conflict</AlertTitle>
                    <AlertDescription className="font-bold flex items-center justify-between">
                        <span>There are {stats.unresolvedConflicts} unresolved inventory conflicts between admin and worker updates.</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-[10px] font-black uppercase px-4"
                            onClick={() => window.location.href = '/admin/inventory'}
                        >
                            Resolve Now
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <StatCards stats={stats} />

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-8">
                    {children}

                    {/* InfoCenter moved here, below charts, taking full width of this column */}
                    <div className="pt-4">
                        <InfoCenter notifications={notifications} onRefresh={manualRefresh} />
                    </div>
                </div>
                <div className="lg:col-span-4 space-y-8">
                    {sidePanel}
                </div>
            </div>
        </div>
    )
}
