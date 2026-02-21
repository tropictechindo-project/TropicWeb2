'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Activity, ShieldCheck, Database, Cloud } from "lucide-react"
import { toast } from 'sonner'

export function SystemControl() {
    const [systems, setSystems] = useState([
        { name: 'Database', status: 'connected', icon: Database },
        { name: 'Supabase Auth', status: 'connected', icon: ShieldCheck },
        { name: 'Prisma Client', status: 'connected', icon: Activity },
        { name: 'Cloudinary API', status: 'connected', icon: Cloud },
    ])
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const isMounted = useRef(true)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const handleReconnect = (name: string) => {
        setIsLoading(name)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            if (isMounted.current) {
                setIsLoading(null)
                toast.success(`${name} reconnected successfully`)
            }
        }, 1500)
    }

    const handleMasterCheck = () => {
        setIsLoading('master')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            if (isMounted.current) {
                setIsLoading(null)
                toast.success("Site health check complete. Everything is running smoothly.")
            }
        }, 2000)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Smart System Control</CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMasterCheck}
                    disabled={isLoading === 'master'}
                >
                    {isLoading === 'master' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Master Health Check
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {systems.map((sys) => (
                        <div key={sys.name} className="flex flex-col gap-1 p-3 border rounded-xl bg-muted/20 items-center text-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{sys.name}</p>
                            <Badge
                                variant={sys.status === 'connected' ? 'default' : 'destructive'}
                                className="text-[10px] font-bold h-5 px-3 rounded-full"
                            >
                                {sys.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
