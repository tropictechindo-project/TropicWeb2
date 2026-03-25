'use client'

import { motion } from 'framer-motion'
import Header from '@/components/header/Header'
import Footer from '@/components/landing/Footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
    Search, 
    LifeBuoy, 
    Package, 
    CreditCard, 
    ShieldAlert, 
    HelpCircle, 
    Mail, 
    MessageSquare, 
    Phone, 
    ArrowRight,
    Monitor,
    Truck,
    Settings,
    UserCheck,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
}

export default function HelpCenterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            
            <main className="flex-1">
                {/* 1. SEARCH HERO */}
                <section className="pt-24 pb-20 bg-primary/5 border-b border-primary/10">
                    <div className="container mx-auto px-4 text-center max-w-4xl pt-16">
                        <motion.div {...fadeIn}>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">How can we help you?</h1>
                            <p className="text-lg text-slate-600 mb-10">Search our knowledge base or browse categories below</p>
                            
                            <div className="relative max-w-2xl mx-auto group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <Input 
                                    placeholder="Search for 'How to pay invoice', 'Delivery tracking', etc." 
                                    className="pl-14 h-16 rounded-2xl border-2 border-slate-200 shadow-xl focus:border-primary focus:ring-primary/20 transition-all text-lg"
                                />
                                <div className="absolute right-3 top-3">
                                    <Button className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20">Search</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 2. CATEGORY GRID */}
                <section className="py-16">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Package className="w-6 h-6" />, title: "Orders & Shipping", desc: "Track, change, or cancel your orders" },
                                { icon: <Monitor className="w-6 h-6" />, title: "Hardware Support", desc: "Setup guides for monitors & chairs" },
                                { icon: <CreditCard className="w-6 h-6" />, title: "Payments & Billing", desc: "Invoices, VAT / NPWP, and Methods" },
                                { icon: <ShieldAlert className="w-6 h-6" />, title: "Account & Safety", desc: "Security, password, and privacy" }
                            ].map((item, id) => (
                                <Card key={id} className="p-8 hover:border-primary/50 transition-all hover:shadow-xl cursor-pointer group hover:-translate-y-1">
                                    <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. QUICK START GUIDE */}
                <section className="py-20 bg-white border-y border-slate-100 overflow-hidden relative">
                    <div className="container mx-auto px-4 max-w-6xl relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Start Renting in 3 Steps</h2>
                            <p className="text-slate-500">Fast, professional, and zero hassle.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connection Lines */}
                            <div className="hidden md:block absolute top-[2.5rem] left-1/4 right-1/4 h-0.5 bg-slate-100 -z-10" />
                            
                            {[
                                { step: "01", title: "Select Unit", desc: "Choose your professional monitor, gear, or ergonomic chair from our catalog." },
                                { step: "02", title: "Verify & Pay", desc: "Complete secure payment via Bank Transfer or CC through our automated system." },
                                { step: "03", title: "Fleet Delivery", desc: "Our Logistics team arrives at your door with professional setup assistance." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center">
                                    <div className="h-20 w-20 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-2xl font-black text-primary mb-6">
                                        {item.step}
                                    </div>
                                    <h4 className="font-bold text-xl mb-4">{item.title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. HARDWARE MASTERY & 5. TROUBLESHOOTING */}
                <section className="py-24">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div>
                                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                    <Settings className="w-8 h-8 text-primary" /> Common Troubleshooting
                                </h2>
                                <Accordion type="single" collapsible className="w-full space-y-4">
                                    {[
                                        { q: "Monitor is not showing display?", a: "Ensure you are using the provided high-speed HDMI/DP cable. Check the source input on the monitor menu. If using a MacBook, ensure you have the correct USB-C hub/adapter." },
                                        { q: "Chair tension is too loose?", a: "Locate the circular knob beneath the seat base. Turn clockwise (right) to increase tension for heavier support, or counter-clockwise (left) to enable easy rocking." },
                                        { q: "How to adjust Standing Desk height?", a: "Use the controller panel on the right side. Hold 'Up' or 'Down' to move. You can save up to 4 presets by holding the 'M' button followed by a number." },
                                        { q: "Can't find my delivery code?", a: "Once your order is processed, a 'Delivery UUID' is sent to your email and WhatsApp. You can also find it under 'My Orders' in the client dashboard." }
                                    ].map((faq, i) => (
                                        <AccordionItem key={i} value={`item-${i}`} className="bg-white px-6 rounded-2xl border border-slate-200">
                                            <AccordionTrigger className="font-bold text-left py-5 hover:text-primary transition-colors">{faq.q}</AccordionTrigger>
                                            <AccordionContent className="text-slate-500 pb-5 leading-relaxed">{faq.a}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                            
                            <div className="space-y-8">
                                <Card className="p-10 border-none bg-slate-900 text-white rounded-[32px] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8">
                                        <Truck className="w-16 h-16 text-white opacity-10 group-hover:scale-125 transition-transform" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 relative z-10">Delivery Protocol</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
                                        Our ground fleet is equipped with real-time GPS. In the Help Center, you can immediately sync with your courier if they are on route.
                                    </p>
                                    <Button variant="outline" className="text-white border-white/20 hover:bg-white hover:text-slate-900 w-full rounded-xl font-bold gap-2">
                                        Track Active Delivery <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Card>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                                        <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <h5 className="font-bold text-green-900 mb-1">Guaranteed</h5>
                                        <p className="text-[10px] text-green-700/60 leading-tight">All hardware is rigorously tested before deployment.</p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                            <UserCheck className="w-5 h-5" />
                                        </div>
                                        <h5 className="font-bold text-blue-900 mb-1">Human Help</h5>
                                        <p className="text-[10px] text-blue-700/60 leading-tight">Tropic Tech support staff are available Mon-Sun.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. INVOICING & 8. ACCOUNT */}
                <section className="py-20 bg-slate-50 border-t border-slate-200">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="md:w-1/2">
                                <h3 className="text-2xl font-bold mb-4">Business & Billing</h3>
                                <p className="text-slate-500 text-sm mb-6">Need a corporate invoice with NPWP / VAT details? Our automated billing system generates these instantly.</p>
                                <ul className="space-y-3">
                                    {[
                                        "Automated PDF Invoices",
                                        "NPWP Incorporation for VAT ID",
                                        "Multiple Payment Gateways (IDR/USD)",
                                        "Custom Billing Cycles for Teams"
                                    ].map((txt, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" /> {txt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="md:w-1/2 grid grid-cols-1 gap-4">
                                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-start">
                                    <Mail className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <p className="font-bold text-sm">Where is my invoice?</p>
                                        <p className="text-xs text-slate-500">Invoices are sent to your registered email immediately after payment confirmation.</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 flex gap-4 items-start">
                                    <Settings className="w-6 h-6 text-primary mt-1" />
                                    <div>
                                        <p className="font-bold text-sm">Update Company Details?</p>
                                        <p className="text-xs text-slate-500">Go to Dashboard &gt; Settings &gt; Billing Info to add your NIB/NPWP for official invoicing.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 9. SUPPORT HUB */}
                <section className="py-24">
                    <div className="container mx-auto px-4 max-w-5xl text-center">
                        <div className="mb-16">
                            <h2 className="text-4xl font-black mb-4">Still need help?</h2>
                            <p className="text-slate-500 max-w-xl mx-auto">Our specialized support team is ready to assist you through several channels.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="p-10 border-none shadow-xl hover:-translate-y-2 transition-all">
                                <MessageSquare className="w-10 h-10 text-green-500 mx-auto mb-6" />
                                <h4 className="font-bold mb-2">WhatsApp Support</h4>
                                <p className="text-xs text-slate-500 mb-6 font-medium">Immediate response for active orders.</p>
                                <Button className="w-full bg-green-500 hover:bg-green-600 rounded-xl font-bold">Open WhatsApp</Button>
                            </Card>
                            <Card className="p-10 border-none shadow-xl hover:-translate-y-2 transition-all">
                                <Mail className="w-10 h-10 text-primary mx-auto mb-6" />
                                <h4 className="font-bold mb-2">Email Support</h4>
                                <p className="text-xs text-slate-500 mb-6 font-medium">For corporate & formal inquiries.</p>
                                <Button className="w-full rounded-xl font-bold">support@tropictech.online</Button>
                            </Card>
                            <Card className="p-10 border-none shadow-xl hover:-translate-y-2 transition-all">
                                <Phone className="w-10 h-10 text-blue-500 mx-auto mb-6" />
                                <h4 className="font-bold mb-2">Phone Inquiry</h4>
                                <p className="text-xs text-slate-500 mb-6 font-medium">Bali Direct Office WITA.</p>
                                <Button variant="outline" className="w-full rounded-xl font-bold border-blue-500/20 text-blue-600 hover:bg-blue-50">Local Hotline</Button>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Additional 7 Sections for total 16 Sections requirement */}

                {/* 10. GLOBAL SEARCH JUMP */}
                <section className="py-12 bg-slate-950 text-white">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm font-medium opacity-60">Can't find what you are looking for? Explore our detailed <span className="text-primary font-bold cursor-pointer hover:underline">FAQ Knowledge Base</span></p>
                    </div>
                </section>

                {/* 11. REFUNDS & RETURNS */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-4 max-w-4xl text-center">
                        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-4">Refunds & Cancelation Policy</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            Cancel your subscription anytime. For early returns, we offer credit towards your next rental. Refunds are processed within 3-5 business days for cancelled deployments that haven't left our facility.
                        </p>
                        <Separator className="mx-auto w-40" />
                    </div>
                </section>

                {/* 12. COMMUNITY & NOMADS */}
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="bg-white p-12 rounded-[40px] shadow-sm flex flex-col md:flex-row items-center gap-12 border border-slate-200">
                            <div className="md:w-1/3">
                                <img src="/images/og-image.webp" className="rounded-3xl shadow-2xl rotate-2 grayscale hover:grayscale-0 transition-all cursor-crosshair" alt="Bali Nomad" />
                            </div>
                            <div className="md:w-2/3">
                                <Badge className="mb-4">Bali Guide</Badge>
                                <h4 className="text-2xl font-bold mb-4">Working in Bali: Power & Internet tips</h4>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    Most Bali villas use Type C/F plugs. We recommend using a stabilizer for high-end monitors. If you experience power surges, our built-in protection in workstations will safeguard your equipment.
                                </p>
                                <Button variant="link" className="p-0 h-auto font-bold text-primary group">
                                    Read Full Nomad Setup Guide <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 13. SAFETY & SECURITY */}
                <section className="py-20">
                    <div className="container mx-auto px-4 max-w-6xl text-center">
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-10">Equipment Safety Protocols</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="text-primary font-bold text-lg italic underline underline-offset-4 decoration-primary/30">Damage Insurance</div>
                                <p className="text-xs text-slate-500">Minor wear and tear is covered. Significant damage incurs a standardized replacement fee based on the unit price.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="text-primary font-bold text-lg italic underline underline-offset-4 decoration-primary/30">Security Deposit</div>
                                <p className="text-xs text-slate-500">No security deposit required for verified digital nomads with valid KITAS or Social Visas.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="text-primary font-bold text-lg italic underline underline-offset-4 decoration-primary/30">Stolen Gear</div>
                                <p className="text-xs text-slate-500">In case of theft, a police report must be filed immediately to initiate investigation and support.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 14. MOBILE ACCESS (PWA) */}
                <section className="py-24 bg-slate-900 text-white rounded-[40px] mx-4 my-20">
                    <div className="container mx-auto px-4 text-center max-w-3xl">
                        <h3 className="text-3xl font-bold mb-6">Access Support on the Go</h3>
                        <p className="text-slate-400 mb-10 font-light text-lg">Add Tropic Tech to your home screen. Track active deliveries and manage your rental workstation directly from your mobile device.</p>
                        <div className="flex justify-center gap-4">
                            <div className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold">iOS: Share &gt; Add to Home Screen</div>
                            <div className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold">Android: Options &gt; Install App</div>
                        </div>
                    </div>
                </section>

                {/* 15. SERVICE STATUS */}
                <section className="py-12 border-b border-slate-100">
                    <div className="container mx-auto px-4 flex justify-center items-center gap-4">
                        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">All Logistics & Support Systems Operational</span>
                    </div>
                </section>

                {/* 16. CONTACT CARD FOOTER */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="container mx-auto px-4 text-center">
                        <div className="p-1 rounded-full bg-slate-100 w-fit mx-auto mb-10">
                            <div className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black uppercase text-slate-400 shadow-sm border border-slate-200">24/7 Priority Support</div>
                        </div>
                        <h2 className="text-4xl font-bold mb-6 tracking-tight">Need a customized setup?</h2>
                        <p className="text-slate-500 mb-12 max-w-2xl mx-auto">Contact our villa deployment experts for large groups or long-term corporate workstations in Bali.</p>
                        <Button size="lg" className="h-16 px-12 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform group">
                            Contact Specialist <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
