"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, CheckCircle, Clock, Package, Navigation as NavigationIcon, Phone, Info } from "lucide-react"

export function TrackingClient({ delivery }: { delivery: any }) {
    const isPickup = delivery.deliveryType === 'PICKUP'

    const getStatusStep = (status: string) => {
        const flow = ['QUEUED', 'CLAIMED', 'OUT_FOR_DELIVERY', 'COMPLETED']
        return flow.indexOf(status)
    }

    const currentStep = getStatusStep(delivery.status)

    const steps = [
        { label: "Queued", desc: "Waiting for assignment", icon: Clock },
        { label: "Assigned", desc: "Worker preparing order", icon: Package },
        { label: isPickup ? "Heading to you" : "Out for Delivery", desc: "Worker is on the way", icon: Truck },
        { label: "Completed", desc: isPickup ? "Items retrieved" : "Successfully delivered", icon: CheckCircle }
    ]

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black tracking-tight text-primary">Delivery Tracker</h1>
                <p className="font-mono text-sm text-muted-foreground">ID: {delivery.trackingCode}</p>
            </div>

            <Card className="shadow-lg border-primary/20">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                            <Badge className="text-sm px-4 py-1 uppercase">{delivery.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estimated Arrival</p>
                            <p className="text-2xl font-bold text-primary">
                                {delivery.eta ? new Date(delivery.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                            </p>
                            {delivery.eta && <p className="text-xs text-muted-foreground">{new Date(delivery.eta).toLocaleDateString()}</p>}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative py-8">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 rounded-full hidden md:block" />
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full transition-all duration-500 hidden md:block"
                            style={{ width: `${Math.max(0, currentStep * 33.33)}%` }}
                        />

                        <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0 relative z-10">
                            {steps.map((step, idx) => {
                                const active = currentStep >= idx
                                return (
                                    <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 text-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${active ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-muted text-muted-foreground'}`}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left md:text-center">
                                            <p className={`text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                                            <p className="text-[10px] text-muted-foreground hidden md:block">{step.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <UserCard icon={Package} title="Order Details" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{delivery.invoice?.guestAddress || "Address provided at checkout"}</p>
                            </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                            {delivery.items?.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">{item.rentalItem?.variant?.product?.name || 'Item'}</span>
                                    <span>x{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <UserCard icon={Truck} title="Courier Details" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 text-center py-8">
                        {delivery.claimedByWorker ? (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary text-xl font-bold">
                                    {delivery.claimedByWorker.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{delivery.claimedByWorker.fullName}</p>
                                    <p className="text-sm text-muted-foreground">TropicTech Logistics</p>
                                </div>
                                <div className="flex justify-center gap-2 pt-2">
                                    {(delivery.latitude && delivery.longitude) && (
                                        <a href={`https://www.google.com/maps?q=${delivery.latitude},${delivery.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors">
                                            <NavigationIcon className="w-4 h-4 text-primary" /> Track Map
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center space-y-2">
                                <Info className="w-8 h-8 opacity-50" />
                                <p className="text-sm">A courier will be assigned shortly.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function UserCard({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <>
            <Icon className="w-4 h-4 text-primary" /> {title}
        </>
    )
}
