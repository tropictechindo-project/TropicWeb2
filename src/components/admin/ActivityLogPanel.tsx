'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, History, User, Activity } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Log {
    id: string
    action: string
    entity: string
    details: string
    createdAt: string
    user?: {
        username: string
        fullName: string
    }
}

export function ActivityLogPanel() {
    const [logs, setLogs] = useState<Log[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/logs')
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs)
            }
        } catch (error) {
            console.error("Failed to fetch logs")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        const interval = setInterval(fetchLogs, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'bg-red-500/10 text-red-500 border-red-500/20'
        if (action.includes('CREATE')) return 'bg-green-500/10 text-green-500 border-green-500/20'
        if (action.includes('UPDATE') || action.includes('PATCH')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        return 'bg-muted text-muted-foreground'
    }

    return (
        <Card className="shadow-xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b py-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> SYSTEM ACTIVITY LOGS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4" />
                            <p className="text-sm font-bold animate-pulse">Synchronizing Logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Activity className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-sm">No activity recorded yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-black truncate">
                                                {log.user?.fullName || log.user?.username || "System Agent"}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-black uppercase ${getActionColor(log.action)}`}>
                                                {log.action.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground">{log.entity}</span>
                                        </div>
                                        {log.details && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed italic bg-muted/30 p-2 rounded-md border border-border/50 mt-1">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="bg-primary/5 p-3 text-center border-t">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">REAL-TIME SURVEILLANCE ACTIVE</p>
                </div>
            </CardContent>
        </Card>
    )
}
