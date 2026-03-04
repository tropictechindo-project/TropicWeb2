"use client"

import { ExternalLink, Handshake } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"

const visas = [
    { code: "B1", title: "B1 Tourist Visa (VOA)", category: "Visitor Visas on Arrival", validity: "30 Days", url: "https://indonesianvisas.com/en/services/B1" },
    { code: "C1", title: "C1 Tourist Visa", category: "Single-Entry Visitor Visas", validity: "60 Days", url: "https://indonesianvisas.com/en/services/C1" },
    { code: "C2", title: "C2 Business Visa", category: "Single-Entry Visitor Visas", validity: "60 Days", url: "https://indonesianvisas.com/en/services/C2" },
    { code: "C12", title: "C12 Pre-Investment Visa", category: "Single-Entry Visitor Visas", validity: "60 / 180 Days", url: "https://indonesianvisas.com/en/services/C12" },
    { code: "D1", title: "D1 Tourist Visa (Multiple)", category: "Multiple-Entry Visitor Visas", validity: "1-3 Years", url: "https://indonesianvisas.com/en/services/D1" },
    { code: "D2", title: "D2 Business Visa (Multiple)", category: "Multiple-Entry Visitor Visas", validity: "1-3 Years", url: "https://indonesianvisas.com/en/services/D2" },
    { code: "D12", title: "D12 Pre-Investment Visa", category: "Multiple-Entry Visitor Visas", validity: "1-2 Years", url: "https://indonesianvisas.com/en/services/D12" },
    { code: "E33G", title: "E33G Digital Nomad Visa", category: "Special Residency Visas", validity: "1 Year", url: "https://indonesianvisas.com/en/services/E33G" },
    { code: "E28A", title: "E28A Investment KITAS", category: "Investor Visas", validity: "1-2 Years", url: "https://indonesianvisas.com/en/services/E28A" }
]

export function LinkedCompanyPanel() {
    return (
        <SidebarGroup className="mt-4 pt-4 border-t border-sidebar-border">
            <SidebarGroupLabel className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <span>Partnership</span>
            </SidebarGroupLabel>

            <SidebarGroupContent className="px-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-3 w-full p-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 transition-all text-left shadow-sm hover:shadow group focus:outline-none focus:ring-2 focus:ring-[#4c1d95]/30">
                            <div className="w-8 h-8 rounded-lg bg-[#4c1d95] flex items-center justify-center text-white font-black shrink-0 shadow-inner">

                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-sm leading-tight text-foreground group-hover:text-[#4c1d95] transition-colors truncate">Indonesian Visas</p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-widest mt-0.5">Explore Services</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-[#4c1d95]/10 group-hover:text-[#4c1d95] transition-colors shrink-0">
                                <Handshake className="w-3 h-3 text-muted-foreground group-hover:text-[#4c1d95]" />
                            </div>
                        </button>
                    </DialogTrigger>

                    <DialogContent className="max-w-[1200px] w-[90vw] h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-border rounded-xl sm:rounded-2xl">
                        <DialogHeader className="p-4 sm:p-6 pb-4 sm:pb-5 border-b border-border bg-muted/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#4c1d95]/5 to-transparent rounded-bl-full pointer-events-none" />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 w-full pr-6">
                                <div className="text-left max-w-2xl">
                                    <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">Indonesian Visas Services</DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm mt-1 leading-relaxed">
                                        Your trusted official visa partner. Select any service below to securely process your travel or residency needs on our Linked Company.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {visas.map((visa) => (
                                    <a
                                        key={visa.code}
                                        href={visa.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-card hover:bg-muted/40 transition-all duration-300 hover:border-[#4c1d95]/40 hover:shadow-md hover:-translate-y-0.5 group h-full relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-bl from-[#4c1d95]/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-opacity group-hover:opacity-100 opacity-0 pointer-events-none" />

                                        <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
                                            <Badge variant="secondary" className="bg-[#4c1d95]/10 text-[#4c1d95] border border-[#4c1d95]/20 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded font-black tracking-widest group-hover:bg-[#4c1d95] group-hover:text-white transition-colors">
                                                {visa.code}
                                            </Badge>
                                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/40 group-hover:text-[#4c1d95] transition-colors" />
                                        </div>

                                        <h4 className="font-extrabold text-sm sm:text-base mb-4 sm:mb-5 text-foreground group-hover:text-[#4c1d95] transition-colors leading-snug flex-1 relative z-10 pr-2">
                                            {visa.title}
                                        </h4>

                                        <div className="space-y-1.5 sm:space-y-2 mt-auto pt-3 sm:pt-4 border-t border-border/60 relative z-10 w-full">
                                            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                                <span className="font-bold tracking-wider text-muted-foreground uppercase text-[10px] sm:text-[10px]">Category</span>
                                                <span className="font-bold text-foreground max-w-[55%] truncate text-right">{visa.category}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                                <span className="font-bold tracking-wider text-muted-foreground uppercase text-[10px] sm:text-[10px]">Validity</span>
                                                <span className="font-bold text-foreground text-right">{visa.validity}</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-border bg-card flex justify-center items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                            <a
                                href="https://indonesianvisas.com/en/services"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#fa782b] hover:bg-[#e66315] text-white text-xs sm:text-sm font-black tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-[#fa782b]/30 w-full max-w-sm focus:ring-4 focus:ring-[#fa782b]/30"
                            >
                                Explore All Visa Services
                                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                        </div>
                    </DialogContent>
                </Dialog>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
