"use client"

import { useState, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
    Phone,
    ChevronLeft,
    Home,
    Map as MapIcon,
    LayoutDashboard
} from "lucide-react"
import Link from "next/link"

export default function TrackingClient({ initialDelivery }: { initialDelivery: any }) {
    const [delivery, setDelivery] = useState(initialDelivery)
    const [showMap, setShowMap] = useState(false)
    const [viewMode, setViewMode] = useState<'status' | 'map'>('status')

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    })

    useEffect(() => {
        // Only poll if the delivery is currently active
        const isActive = ['ASSIGNED', 'OUT_FOR_DELIVERY', 'PAUSED', 'DELAYED'].includes(delivery.status)
        if (!isActive) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/tracking/${delivery.trackingCode}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.delivery) {
                        setDelivery((prev: any) => ({
                            ...prev,
                            status: data.delivery.status,
                            latitude: data.delivery.latitude,
                            longitude: data.delivery.longitude,
                            lastLocationUpdate: data.delivery.lastLocationUpdate,
                            eta: data.delivery.eta,
                            delayMinutes: data.delivery.delayMinutes
                        }))
                    }
                }
            } catch (err) {
                console.error("Polling error", err)
            }
        }, 10000) // Poll every 10 seconds

        return () => clearInterval(interval)
    }, [delivery.trackingCode, delivery.status])

    const mapCenter = {
        lat: Number(delivery.latitude) || -8.650000,
        lng: Number(delivery.longitude) || 115.216667
    }

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
            case 'COMPLETED': return "bg-green-500 text-white shadow-green-500/20"
            case 'OUT_FOR_DELIVERY': return "bg-orange-500 text-white shadow-orange-500/20"
            case 'CANCELED': return "bg-red-500 text-white shadow-red-500/20"
            case 'DELAYED':
            case 'PAUSED': return "bg-yellow-500 text-white shadow-yellow-500/20"
            default: return "bg-blue-500 text-white shadow-blue-500/20"
        }
    }

    return (
        <div className="min-h-screen bg-muted/30 pb-20 pt-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary selection:text-white">
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Navigation Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="rounded-full font-bold text-[10px] uppercase tracking-widest gap-2 bg-background border shadow-sm">
                            <Link href="/">
                                <Home className="w-3.5 h-3.5" /> Home
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="rounded-full font-bold text-[10px] uppercase tracking-widest gap-2 bg-background border shadow-sm">
                            <Link href="/dashboard/user">
                                <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
                            </Link>
                        </Button>
                    </div>
                    <Badge variant="outline" className="rounded-full font-mono text-[10px] bg-background border px-3 py-1 shadow-sm">
                        REF: {delivery.trackingCode}
                    </Badge>
                </div>

                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">Global Tracker</h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] opacity-60">Real-time Logistics Monitoring</p>
                </div>

                {/* Main Tracking Card */}
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2rem] bg-background/60 backdrop-blur-xl border border-white/10">
                    <div className="h-1.5 w-full bg-primary/20">
                        <div className={`h-full transition-all duration-1000 ${delivery.status === 'COMPLETED' ? 'w-full bg-green-500' : 'w-2/3 bg-primary'}`} />
                    </div>

                    <CardHeader className="pb-4 relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Truck className="w-32 h-32" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Operational Status</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className={`${getStatusColor(delivery.status)} px-4 py-1.5 text-xs font-black rounded-full tracking-wider uppercase border-none shadow-lg animate-pulse`}>
                                            {getStatusText(delivery.status)}
                                        </Badge>

                                        {delivery.status === 'OUT_FOR_DELIVERY' && (
                                            <div className="flex gap-1 p-1 bg-muted rounded-full border">
                                                <Button
                                                    size="sm"
                                                    variant={viewMode === 'status' ? 'default' : 'ghost'}
                                                    onClick={() => setViewMode('status')}
                                                    className="h-7 px-3 rounded-full text-[10px] font-black"
                                                >
                                                    DETAILED
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                                                    onClick={() => setViewMode('map')}
                                                    className="h-7 px-3 rounded-full text-[10px] font-black gap-1"
                                                >
                                                    <MapIcon className="w-3 h-3" /> MAP VIEW
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-left sm:text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center sm:justify-end gap-1 mb-2">
                                    <Clock className="w-3 h-3" /> System Heartbeat
                                </p>
                                <p className="font-bold text-sm tracking-tight bg-muted/50 px-3 py-1.5 rounded-lg inline-block">
                                    {new Date(delivery.lastLocationUpdate || delivery.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-8 relative z-10">
                        {viewMode === 'map' && delivery.status === 'OUT_FOR_DELIVERY' ? (
                            <div className="h-[400px] rounded-[1.5rem] overflow-hidden border-4 border-white shadow-2xl relative group">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={mapCenter}
                                        zoom={16}
                                        options={{
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            mapTypeControl: false,
                                            streetViewControl: false,
                                            styles: [
                                                { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
                                                { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 13 }] }
                                            ]
                                        }}
                                    >
                                        <Marker
                                            position={mapCenter}
                                            icon={{
                                                path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.1 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
                                                fillColor: "#f97316",
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: "#ffffff",
                                                scale: 1.5,
                                                anchor: isLoaded ? new window.google.maps.Point(12, 12) : undefined
                                            }}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center justify-between border border-white/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <MapPin className="text-primary w-5 h-5 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Position</p>
                                            <p className="text-xs font-bold truncate max-w-[200px]">{mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => setViewMode('status')} className="h-8 rounded-full text-[10px] font-black">EXIT MAP</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* ETA Banner */}
                                {delivery.eta && delivery.status === 'OUT_FOR_DELIVERY' && (
                                    <div className="p-8 rounded-[1.5rem] border-2 border-primary/20 bg-primary/5 text-center shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">Target Arrival Time</p>
                                        <h2 className="text-5xl font-black text-foreground tracking-tighter shadow-sm">
                                            {new Date(delivery.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </h2>
                                        {delivery.delayMinutes > 0 && (
                                            <div className="mt-4 inline-flex items-center gap-2 bg-red-500/10 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                                <AlertCircle className="w-3.5 h-3.5" /> Delay Detected: +{delivery.delayMinutes} min
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Courier & Vehicle Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-2xl border bg-muted/10 group hover:bg-muted/20 hover:border-primary/30 transition-all duration-300">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-background border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                <User className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Active Courier</p>
                                                <p className="font-black text-lg tracking-tight">{delivery.claimedByWorker?.fullName || "Pending Assignment"}</p>
                                                {delivery.claimedByWorker?.whatsapp && (
                                                    <a href={`https://wa.me/${delivery.claimedByWorker.whatsapp}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors">
                                                        <Phone className="w-3.5 h-3.5" /> {delivery.claimedByWorker.whatsapp}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl border bg-muted/10 group hover:bg-muted/20 hover:border-primary/30 transition-all duration-300">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-background border flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                                <Truck className="w-7 h-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Deployed Logistics</p>
                                                <p className="font-black text-lg tracking-tight truncate">{delivery.vehicle?.name || "Island Fleet Van"}</p>
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 uppercase font-black bg-primary/10 text-primary border-none">{delivery.vehicle?.type || "Standard"}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items & Logs */}
                                <div className="grid md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground border-b pb-2">
                                            <Package className="w-3.5 h-3.5 text-primary" /> Manifest
                                        </h3>
                                        <div className="space-y-2">
                                            {delivery.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border bg-background/50 backdrop-blur-sm group hover:border-primary/20 transition-all">
                                                    <span className="font-bold text-xs">
                                                        {item.productName || item.rentalItem?.variant?.product?.name || "Equipment Package"}
                                                    </span>
                                                    <span className="text-[10px] font-black bg-muted px-2 py-1 rounded-md">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground border-b pb-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Event Log
                                        </h3>
                                        <div className="space-y-4 pt-1">
                                            {delivery.logs?.slice(0, 4).map((log: any, idx: number) => (
                                                <div key={idx} className="relative pl-6">
                                                    <div className={`absolute w-1.5 h-1.5 ${idx === 0 ? 'bg-primary ring-4 ring-primary/20 scale-125' : 'bg-muted-foreground/30'} rounded-full left-0 top-1 transition-all duration-500`} />
                                                    <p className={`text-[11px] font-black leading-none uppercase tracking-tight ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{log.eventType}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{log.newValue?.notes || "Status confirmed."}</p>
                                                    <p className="text-[9px] font-bold opacity-40 mt-1 uppercase">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>

                    <div className="p-4 bg-muted/30 border-t flex items-center justify-center gap-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Secured 256-bit Logistics Data Connection</p>
                    </div>
                </Card>

                {/* Footer CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                    <Button variant="outline" asChild className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest gap-2 bg-background border-2 shadow-sm order-2 sm:order-1">
                        <Link href="/">
                            <Home className="w-4 h-4" /> Back to Home
                        </Link>
                    </Button>
                    <Button className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 order-1 sm:order-2" asChild>
                        <Link href="/dashboard/user">
                            <LayoutDashboard className="w-4 h-4" /> Client Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
