'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ApiEndpoint {
    name: string
    url: string
    method: string
    requiresAuth: boolean
}

const ENDPOINTS: ApiEndpoint[] = [
    { name: 'Auth Check (Me)', url: '/api/auth/me', method: 'GET', requiresAuth: true },
    { name: 'SPI Realtime Stream', url: '/api/spi/notifications', method: 'GET', requiresAuth: true },
    { name: 'AI Audit Cron', url: '/api/cron/smart-check', method: 'GET', requiresAuth: false },
    { name: 'Users List', url: '/api/users?limit=1', method: 'GET', requiresAuth: true },
    { name: 'Products List', url: '/api/products?limit=1', method: 'GET', requiresAuth: false },
    { name: 'Orders List', url: '/api/admin/orders?limit=1', method: 'GET', requiresAuth: true },
    { name: 'Workers List', url: '/api/admin/workers?limit=1', method: 'GET', requiresAuth: true },
    { name: 'Admin Deliveries', url: '/api/admin/deliveries?limit=1', method: 'GET', requiresAuth: true },
    { name: 'Messages (Unread)', url: '/api/messages/unread-count', method: 'GET', requiresAuth: true },
    { name: 'Activity Logs', url: '/api/admin/logs?limit=1', method: 'GET', requiresAuth: true },
]

interface ApiStatus {
    [url: string]: {
        status: number
        ok: boolean
        latency: number
        error?: string
    }
}

export function ApiStatusPanel() {
    const [statuses, setStatuses] = useState<ApiStatus>({})
    const [loading, setLoading] = useState(false)

    const checkApis = async () => {
        setLoading(true)
        const token = localStorage.getItem('token')
        const results: ApiStatus = {}

        for (const endpoint of ENDPOINTS) {
            const startTime = performance.now()
            try {
                const headers: HeadersInit = {}
                if (endpoint.requiresAuth && token) {
                    headers['Authorization'] = `Bearer ${token}`
                }

                const res = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers
                })

                const latency = Math.round(performance.now() - startTime)
                results[endpoint.url] = {
                    status: res.status,
                    ok: res.ok,
                    latency
                }
            } catch (error) {
                const latency = Math.round(performance.now() - startTime)
                results[endpoint.url] = {
                    status: 0,
                    ok: false,
                    latency,
                    error: error instanceof Error ? error.message : 'Network Error'
                }
            }
        }

        setStatuses(results)
        setLoading(false)
        toast.success('API Status Updated')
    }

    useEffect(() => {
        checkApis()
    }, [])

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System API Status</CardTitle>
                <Button variant="ghost" size="icon" onClick={checkApis} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground border-b pb-2 mb-2">
                        <div className="col-span-4">Endpoint</div>
                        <div className="col-span-2 text-center">Method</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-center">Latency</div>
                        <div className="col-span-2 text-right">Result</div>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-3">
                            {ENDPOINTS.map((endpoint) => {
                                const status = statuses[endpoint.url]
                                return (
                                    <div key={endpoint.url} className="grid grid-cols-12 items-center text-sm">
                                        <div className="col-span-4 truncate font-medium" title={endpoint.url}>
                                            {endpoint.name}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1">{endpoint.method}</Badge>
                                        </div>
                                        <div className="col-span-2 text-center font-mono text-xs">
                                            {status ? status.status || 'ERR' : '-'}
                                        </div>
                                        <div className="col-span-2 text-center text-xs text-muted-foreground">
                                            {status ? `${status.latency}ms` : '-'}
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            {status ? (
                                                status.ok ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <div className="flex items-center text-red-500" title={status.error}>
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        <span className="text-[10px] hidden md:inline">Fail</span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    )
}
