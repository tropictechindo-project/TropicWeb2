"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    MapPin,
    Package,
    Clock,
    User,
    CheckCircle2,
    Truck,
    AlertCircle,
    Info,
    Calendar,
    Phone
} from "lucide-react"

export default function TrackingClient({ initialDelivery }: { initialDelivery: any }) {
    const delivery = initialDelivery

    const getStatusText = (status: string) => {
        switch (status) {
            case 'QUEUED': return "Preparing for Dispatch"
            case 'CLAIMED': return "Assigned to Courier"
            case 'OUT_FOR_DELIVERY': return "Out for Delivery"
            case 'PAUSED': return "Delivery Paused"
            case 'DELAYED': return "Delivery Delayed"
            case 'CANCEL_REQUESTED': return "Cancellation Requested"
            case 'COMPLETED': return "Delivered Successfully"
            case 'CANCELED': return "Delivery Canceled"
            default: return "Unknown Status"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return "bg-green-500 text-white"
            case 'OUT_FOR_DELIVERY': return "bg-orange-500 text-white"
            case 'CANCELED': return "bg-red-500 text-white"
            case 'DELAYED':
            case 'PAUSED': return "bg-yellow-500 text-white"
            default: return "bg-blue-500 text-white"
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">

                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-black tracking-tighter">Delivery Tracking</h1>
                    <p className="text-muted-foreground">Tracking Code: <span className="font-mono font-bold">{delivery.trackingCode}</span></p>
                </div>

                <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader className="bg-primary/5 pb-4 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-black">Current Status</CardTitle>
                                <div className="mt-2 inline-flex">
                                    <Badge className={`${getStatusColor(delivery.status)} px-3 py-1 text-sm rounded-full tracking-wide`}>
                                        {getStatusText(delivery.status)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-sm text-muted-foreground flex items-center sm:justify-end gap-1 mb-1">
                                    <Clock className="w-4 h-4" /> Last Updated
                                </p>
                                <p className="font-medium text-sm">
                                    {new Date(delivery.updatedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">

                        {/* Courier Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border bg-card flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Courier</p>
                                    <p className="font-bold">{delivery.claimedByWorker?.fullName || "Awaiting Assignment"}</p>
                                    {delivery.claimedByWorker?.whatsapp && (
                                        <p className="text-sm flex items-center gap-1 text-muted-foreground mt-1">
                                            <Phone className="w-3 h-3" /> {delivery.claimedByWorker.whatsapp}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border bg-card flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Vehicle</p>
                                    <p className="font-bold">{delivery.vehicle?.name || "Pending Dispatch"}</p>
                                    {delivery.vehicle?.type && (
                                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                                            {delivery.vehicle.type.toLowerCase()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Estimated Time of Arrival */}
                        {delivery.eta && delivery.status === 'OUT_FOR_DELIVERY' && (
                            <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5 text-center">
                                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Estimated Arrival</p>
                                <h2 className="text-3xl font-black text-primary">
                                    {new Date(delivery.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </h2>
                                {delivery.delayMinutes > 0 && (
                                    <p className="text-sm font-bold text-red-500 mt-2 flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" /> Contains {delivery.delayMinutes} min delay
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Items */}
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
                                <Package className="w-5 h-5 text-primary" /> Delivery Items
                            </h3>
                            <div className="space-y-3">
                                {delivery.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                                        <span className="font-medium text-sm">
                                            {item.productName || item.rentalItem?.variant?.product?.name || "Rental Package"}
                                        </span>
                                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logs / Timeline */}
                        {delivery.logs && delivery.logs.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary" /> Tracking History
                                </h3>
                                <div className="space-y-4 pl-4 border-l-2 border-muted ml-2">
                                    {delivery.logs.map((log: any, idx: number) => {
                                        // Try to parse notes if they were JSON stringified
                                        let note = log.newValue?.notes || "Status updated"
                                        return (
                                            <div key={idx} className="relative pl-6">
                                                <div className="absolute w-3 h-3 bg-primary rounded-full left-[-23px] top-1.5 border-2 border-white ring-2 ring-primary/20" />
                                                <p className="text-sm font-bold">{log.eventType}</p>
                                                <p className="text-sm text-muted-foreground">{note}</p>
                                                <p className="text-xs text-muted-foreground/70 mt-1">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
