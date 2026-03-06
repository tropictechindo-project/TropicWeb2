"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Map, Truck, ShieldCheck, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TrackerSection() {
    const [invoiceCode, setInvoiceCode] = useState("")
    const router = useRouter()

    const handleTrack = () => {
        if (!invoiceCode.trim()) return
        router.push(`/tracking?invoice=${invoiceCode.trim()}`)
    }

    return (
        <section className="py-24 relative overflow-hidden bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="container px-4 mx-auto relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground">
                            Real-Time <span className="text-primary italic">Global</span> Tracking
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                            Experience Maping style live delivery tracking. Monitor your workstation's journey from our warehouse to your doorstep in real-time.
                        </p>
                    </div>

                    <Card className="border-primary/20 shadow-2xl shadow-primary/5 overflow-hidden bg-card/50 backdrop-blur-xl">
                        <CardContent className="p-8 md:p-12">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                <Map className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg uppercase tracking-tight">Live Map Integration</h4>
                                                <p className="text-sm text-muted-foreground">Watch our couriers move on the map with Google Maps precision.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                                <Truck className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg uppercase tracking-tight">Status Notifications</h4>
                                                <p className="text-sm text-muted-foreground">Get instant updates from Dispatch to "Out for Delivery" and "Arrival".</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                                                <ShieldCheck className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg uppercase tracking-tight">Secure & Trusted</h4>
                                                <p className="text-sm text-muted-foreground">Encryption protected tracking data for your privacy and security.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-8 rounded-3xl border border-border/50 space-y-6">
                                    <div className="space-y-2 text-center md:text-left">
                                        <h3 className="text-2xl font-black uppercase tracking-tight">Track Your Order</h3>
                                        <p className="text-sm text-muted-foreground">Enter your invoice number below to start tracking.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder="INV-XXXXXX"
                                                value={invoiceCode}
                                                onChange={(e) => setInvoiceCode(e.target.value.toUpperCase())}
                                                className="h-16 pl-12 rounded-2xl border-2 border-border focus:border-primary/50 bg-background text-lg font-bold tracking-wider uppercase"
                                                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                            />
                                        </div>
                                        <Button
                                            onClick={handleTrack}
                                            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 group"
                                            disabled={!invoiceCode.trim()}
                                        >
                                            Track Mission <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest">
                                        Powered by TropicTech Global Logistics System
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
