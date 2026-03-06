'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function ClientLogos() {
    const { t } = useLanguage()

    const clients = [
        {
            name: 'Digital Nomads',
            description: 'Solo professionals moving to Bali for work and lifestyle.',
            icon: '🌊'
        },
        {
            name: 'Startup Teams',
            description: 'Distributed teams setting up temporary hubs in tropical paradise.',
            icon: '🚀'
        },
        {
            name: 'Retreat Organizers',
            description: 'Large groups requiring bulk infrastructure for events.',
            icon: '🧘'
        }
    ]

    return (
        <section className="py-12 bg-muted/30 border-y border-dashed">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xs text-center md:text-left">
                        <h3 className="text-xl font-black tracking-tighter text-primary uppercase">Trusted By</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Powering remote work for the world's most mobile talent.</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                        {clients.map((client) => (
                            <div
                                key={client.name}
                                className="group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col items-center text-center"
                            >
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 grayscale group-hover:grayscale-0">
                                    {client.icon}
                                </div>
                                <h4 className="font-bold text-lg mb-1">{client.name}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{client.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
