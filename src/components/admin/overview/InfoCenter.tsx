import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Bell, CheckCircle2, AlertCircle, AlertTriangle, Info, X,
    Package, FileText, MessageSquare, ArrowUpRight, User, Activity, RefreshCw, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Notification {
    id: string
    type: 'ERROR' | 'WARNING' | 'SUCCESS' | 'INFO'
    title: string
    message: string
    createdAt: string
    entityId?: string
    source?: 'ORDER' | 'REPORT' | 'MESSAGE' | 'SYSTEM' | 'USER' | 'ACTIVITY'
}

interface InfoCenterProps {
    notifications: Notification[]
    onRefresh?: () => void
}

export function InfoCenter({ notifications: initialNotifications, onRefresh }: InfoCenterProps) {
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    // Filter out locally hidden notifications (optimistic UI)
    const notifications = initialNotifications.filter(n => !hiddenIds.has(n.entityId || n.id))

    const handleRefresh = async () => {
        if (!onRefresh) return
        setIsRefreshing(true)
        await onRefresh()
        setTimeout(() => setIsRefreshing(false), 1000) // Min spin time
    }

    const handleDismissAll = async () => {
        if (notifications.length === 0) return

        setIsClearing(true)

        // Optimistic clear
        const currentIds = notifications.map(n => n.entityId || n.id)
        const newHiddenIds = new Set([...hiddenIds, ...currentIds])
        setHiddenIds(newHiddenIds)

        try {
            const res = await fetch('/api/admin/notifications/dismiss-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notifications: notifications.map(n => ({
                        entityId: n.entityId || n.id,
                        source: n.source
                    }))
                })
            })

            if (!res.ok) throw new Error('Failed to dismiss all')
            toast.success('All notifications cleared')
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error(error)
            toast.error('Failed to clear notifications')
            // Revert optimistic update basically requires refreshing from server or undoing setHiddenIds
            // But for "Clear All", usually a refresh is safer.
            if (onRefresh) onRefresh()
        } finally {
            setIsClearing(false)
        }
    }

    const handleDismiss = async (e: React.MouseEvent, note: any) => {
        e.stopPropagation() // Prevent triggering card click

        // Optimistic update
        const idToHide = note.entityId || note.id
        setHiddenIds(prev => new Set(prev).add(idToHide))

        try {
            const res = await fetch('/api/admin/notifications/dismiss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityId: note.entityId || note.id,
                    entityType: note.source || note.type // Source is mapped in API (ORDER, REPORT, etc), Type is for SYSTEM
                })
            })

            if (!res.ok) throw new Error('Failed to dismiss')
            toast.success('Notification dismissed')

            if (onRefresh) onRefresh()
        } catch (error) {
            console.error(error)
            toast.error('Failed to dismiss')
            setHiddenIds(prev => {
                const next = new Set(prev)
                next.delete(idToHide)
                return next
            })
        }
    }

    return (
        <Card className="h-full border-2 border-primary/5 shadow-lg flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-muted/20 shrink-0">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Information Center
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">Real-time system updates & alerts</p>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh Updates</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                    onClick={handleDismissAll}
                                    disabled={isClearing || notifications.length === 0}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear All</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Badge variant="secondary" className="font-bold px-3 py-1 bg-background border shadow-sm">
                        {notifications.length} Active
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-3">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-3">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 opacity-20" />
                                </div>
                                <p className="font-medium text-sm">All caught up!</p>
                                <p className="text-xs opacity-70">No new notifications to display</p>
                            </div>
                        ) : (
                            notifications.map((note) => (
                                <div
                                    key={note.id}
                                    className="group relative flex gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-200"
                                >
                                    <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${note.source === 'ORDER' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        note.source === 'REPORT' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            note.source === 'MESSAGE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                note.source === 'USER' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                                                    note.source === 'ACTIVITY' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                                                        note.type === 'ERROR' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            note.type === 'WARNING' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                                note.type === 'SUCCESS' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {note.source === 'ORDER' ? <Package className="h-5 w-5" /> :
                                            note.source === 'REPORT' ? <FileText className="h-5 w-5" /> :
                                                note.source === 'MESSAGE' ? <MessageSquare className="h-5 w-5" /> :
                                                    note.source === 'USER' ? <User className="h-5 w-5" /> :
                                                        note.source === 'ACTIVITY' ? <Activity className="h-5 w-5" /> :
                                                            note.type === 'ERROR' ? <AlertCircle className="h-5 w-5" /> :
                                                                note.type === 'WARNING' ? <AlertTriangle className="h-5 w-5" /> :
                                                                    note.type === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5" /> :
                                                                        <Info className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1 pr-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold leading-none tracking-tight">{note.title}</p>
                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full">
                                                {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {note.message}
                                        </p>
                                        {/* Action Area */}
                                        <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-primary/5 hover:text-primary">
                                                View Details <ArrowUpRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Dismiss Button */}
                                    <button
                                        onClick={(e) => handleDismiss(e, note)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        title="Dismiss notification"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
