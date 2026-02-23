"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bot, Lock, ShieldCheck, Zap, AlertTriangle } from "lucide-react"

export function AgentSettings({ agents }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent: any) => (
                <Card key={agent.id} className="border-primary/20 overflow-hidden relative group">
                    {!agent.isActive && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-zinc-500 text-zinc-500">OFFLINE</Badge>
                        </div>
                    )}
                    <CardHeader className="p-6 bg-primary/5 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary p-2 rounded-xl shadow-lg ring-4 ring-primary/10">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-tighter">AI-{agent.systemName}</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase opacity-60 truncate max-w-[150px]">{agent.displayName}</CardDescription>
                                </div>
                            </div>
                            <Switch checked={agent.isActive} />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 flex items-center gap-2">
                                <Lock className="h-3 w-3" /> Core Permissions
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                                    <span className="text-[10px] font-bold uppercase opacity-60">Products</span>
                                    {agent.permissions?.canModifyProducts ? <Zap className="h-3 w-3 text-yellow-500" /> : <ShieldCheck className="h-3 w-3 text-primary/40" />}
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                                    <span className="text-[10px] font-bold uppercase opacity-60">Packages</span>
                                    {agent.permissions?.canModifyPackages ? <Zap className="h-3 w-3 text-yellow-500" /> : <ShieldCheck className="h-3 w-3 text-primary/40" />}
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 text-border">
                                    <span className="text-[10px] font-bold uppercase opacity-60">Orders</span>
                                    {agent.permissions?.canModifyOrders ? <Zap className="h-3 w-3 text-yellow-500" /> : <ShieldCheck className="h-3 w-3 text-primary/40" />}
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                                    <span className="text-[10px] font-black uppercase text-primary italic">Oversight</span>
                                    <Badge variant="outline" className="text-[8px] font-black border-primary/40">MANDATORY</Badge>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-primary/10" />

                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" /> Security Override
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium leading-tight">Allow AI to directly mutate without Admin confirmation?</span>
                                <Switch checked={!agent.permissions?.requiresAdminConfirmation} disabled />
                            </div>
                            <p className="text-[8px] text-destructive font-black uppercase tracking-tighter">* Direct mutation is disabled for this agent system.</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
