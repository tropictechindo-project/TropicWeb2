'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCcw,
    CalendarClock,
    CornerDownLeft
} from 'lucide-react'

export function ServiceRequestsClient() {
    const [requests, setRequests] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/operator/item-requests', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setRequests(data.requests)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/operator/item-requests/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(`Request ${status.toLowerCase()} successfully.`)
            fetchRequests()
        } catch (error: any) {
            toast.error(error.message || 'Failed to process request')
        }
    }

    const getIconPrefix = (type: string) => {
        switch (type) {
            case 'SWAP': return <RefreshCcw className="w-4 h-4 text-blue-500" />
            case 'RETURN': return <CornerDownLeft className="w-4 h-4 text-red-500" />
            case 'EXTENSION': return <CalendarClock className="w-4 h-4 text-primary" />
            default: return <AlertCircle className="w-4 h-4 text-zinc-500" />
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Service Engine...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Service Requests</h1>
                    <p className="text-muted-foreground font-medium">Approve client-submitted Extensions, Swaps, and Replacements.</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                    <p className="font-black text-xl uppercase tracking-tighter">Queue Empty</p>
                    <p className="text-muted-foreground text-sm mt-1">No pending rental actions require your attention.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row border-l-4 border-primary">
                                <div className="p-6 md:w-80 border-b md:border-b-0 md:border-r bg-muted/10 space-y-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Order Ref</div>
                                        <div className="font-mono font-bold text-primary">{req.rentalItem.order.orderNumber}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Client Details</div>
                                        <div className="font-bold">{req.user.fullName}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <span>WhatsApp:</span> {req.user.whatsapp}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-black bg-orange-500/10 text-orange-600 border-orange-200 uppercase tracking-widest">{req.status}</Badge>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b pb-4">
                                            {getIconPrefix(req.type)}
                                            <h3 className="text-xl font-black tracking-tighter">
                                                CLIENT DEMANDED <span className="text-primary">{req.type}</span>
                                            </h3>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight border-l-2 border-muted pl-3 py-1 bg-muted/20">
                                                {req.rentalItem.variant?.product?.name || req.rentalItem.rentalPackage?.name || "Equipment Segment"}
                                                <span className="text-primary ml-2 uppercase text-[10px] tracking-widest font-black">x{req.rentalItem.quantity}</span>
                                                {req.rentalItem.unit?.serialNumber && (
                                                    <span className="ml-3 font-mono text-[10px] text-muted-foreground">SN: {req.rentalItem.unit.serialNumber.slice(-6)}</span>
                                                )}
                                            </p>
                                        </div>
                                        {req.reason && (
                                            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                                <p className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Provided Context:</p>
                                                <p className="text-sm font-medium text-orange-900">{req.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button variant="outline" className="font-bold text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(req.id, 'REJECTED')}>
                                            <XCircle className="w-4 h-4 mr-2" />
                                            REJECT
                                        </Button>
                                        <Button className="font-bold px-8 shadow-lg shadow-primary/20" onClick={() => handleAction(req.id, 'APPROVED')}>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            APPROVE INCIDENT
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
