"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import Image from "next/image"

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
                <span>Linked Company</span>
            </SidebarGroupLabel>

            <SidebarGroupContent className="px-2">
                <a href="https://indonesianvisas.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-4 group hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-md bg-[#4c1d95] flex items-center justify-center text-white font-bold shrink-0">
                        IV
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight text-foreground group-hover:text-[#4c1d95] transition-colors">Indonesian Visas</p>
                        <p className="text-[10px] text-muted-foreground">Official Visa Partner</p>
                    </div>
                </a>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
                    {visas.map((visa) => (
                        <a
                            key={visa.code}
                            href={visa.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-all hover:border-[#4c1d95]/50 hover:shadow-sm group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-muted text-foreground text-[9px] px-1.5 py-0 rounded font-black tracking-widest group-hover:bg-[#4c1d95]/10 group-hover:text-[#4c1d95] transition-colors">
                                    {visa.code}
                                </Badge>
                            </div>
                            <h4 className="font-bold text-sm mb-3 group-hover:text-[#4c1d95] transition-colors leading-tight">
                                {visa.title}
                            </h4>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black tracking-widest text-muted-foreground uppercase">Category</span>
                                    <span className="font-semibold text-right">{visa.category}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black tracking-widest text-muted-foreground uppercase">Validity</span>
                                    <span className="font-semibold text-right">{visa.validity}</span>
                                </div>
                            </div>
                        </a>
                    ))}

                    <a
                        href="https://indonesianvisas.com/en/services"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full p-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors mt-2"
                    >
                        View All Visa Services
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
