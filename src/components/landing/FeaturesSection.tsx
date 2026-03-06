'use client'

import { useState } from 'react'
import {
    Zap,
    Clock,
    Calendar,
    ShieldCheck,
    Truck,
    Package,
    MapPin,
    Settings2
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

const features = [
    {
        id: 'delivery',
        title: 'Real-Time Delivery Tracking',
        description: 'Track your workstation delivery live. Know exactly when your setup arrives.',
        icon: Truck,
        details: 'Our advanced logistics system provides a live map view of your delivery agent. You will receive a tracking link via WhatsApp as soon as our team leaves the warehouse.'
    },
    {
        id: 'setup',
        title: 'Fast Setup',
        description: 'Workstation installed within 24 hours anywhere in Bali.',
        icon: Zap,
        details: 'From Canggu to Ubud, we guarantee a professional installation within 24 hours of your order confirmation. Our team handles everything from assembly to cable management.'
    },
    {
        id: 'rental',
        title: 'Flexible Rental',
        description: 'Rent by the Day, Week, or Month. Scale your setup as you go.',
        icon: Calendar,
        details: 'Plans that adapt to your stay. Start with a daily rental and upgrade to monthly as needed. No long-term contracts or hidden fees.'
    },
    {
        id: 'instant',
        title: 'Instant Workspace',
        description: 'No shopping, no assembly, no logistics. Just work.',
        icon: Package,
        details: 'Focus on your projects, not your furniture. We provide enterprise-grade equipment (Dell, Herman Miller, etc.) delivered and set up so you can be productive from minute one.'
    }
]

export default function FeaturesSection() {
    const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null)

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">ENGINEERED FOR PRODUCTIVITY</h2>
                    <p className="text-muted-foreground text-lg">We handle the infrastructure so you can handle the innovation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature)}
                            className="group relative p-8 bg-card border rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden border-muted-foreground/10 hover:border-primary/50"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <feature.icon className="w-24 h-24" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 leading-tight">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

                                <div className="mt-6 flex items-center text-xs font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Learn More <span className="ml-2">→</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    {selectedFeature && (
                        <>
                            <DialogHeader>
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                                    <selectedFeature.icon className="w-8 h-8" />
                                </div>
                                <DialogTitle className="text-2xl font-black tracking-tighter">
                                    {selectedFeature.title}
                                </DialogTitle>
                                <DialogDescription className="text-base pt-2 leading-relaxed">
                                    {selectedFeature.details}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-6">
                                <div className="bg-muted p-4 rounded-2xl border border-dashed border-muted-foreground/20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" /> Tropic Tech Guarantee
                                    </p>
                                    <p className="text-xs leading-relaxed">
                                        Available across all of Bali including Canggu, Seminyak, Ubud, and beyond.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    )
}
