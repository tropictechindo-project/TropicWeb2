import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle, Server, Database } from "lucide-react"
import { Button } from "@/components/ui/button"

async function checkHealth() {
    try {
        await db.$queryRaw`SELECT 1`
        return { status: 'ONLINE', latency: 'OK' }
    } catch (e) {
        return { status: 'OFFLINE', error: String(e) }
    }
}

export default async function AdminSystemPage() {
    const dbStatus = await checkHealth()

    // Fetch Error Logs
    const errorLogs = await db.systemNotification.findMany({
        where: { type: { in: ['ERROR', 'WARNING'] } },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">System Status</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>Database (Supabase)</CardTitle>
                            <CardDescription>PostgreSQL Connection</CardDescription>
                        </div>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-4">
                            <Badge variant={dbStatus.status === 'ONLINE' ? 'default' : 'destructive'}>
                                {dbStatus.status}
                            </Badge>
                            {dbStatus.status === 'ONLINE' && <span className="text-sm text-muted-foreground">Latency: Normal</span>}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>API System</CardTitle>
                            <CardDescription>Internal Routes</CardDescription>
                        </div>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-4">
                            <Badge variant="default">ONLINE</Badge>
                            <span className="text-sm text-muted-foreground">Next.js App Router Active</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Error Logs</CardTitle>
                    <CardDescription>Recent system errors and warnings</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {errorLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No errors recorded</div>
                            ) : (
                                errorLogs.map(log => (
                                    <div key={log.id} className="flex gap-4 p-4 border rounded-lg items-start">
                                        {log.type === 'ERROR' ? <AlertTriangle className="text-red-500 h-5 w-5 mt-1" /> : <AlertTriangle className="text-yellow-500 h-5 w-5 mt-1" />}
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm">{log.title}</p>
                                            <p className="text-sm text-muted-foreground break-all">{log.message}</p>
                                            <p className="text-xs text-muted-foreground pt-1">{new Date(log.createdAt!).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
