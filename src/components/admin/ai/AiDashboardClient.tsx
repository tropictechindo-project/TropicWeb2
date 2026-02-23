"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ShieldCheck, Settings2, Activity } from "lucide-react"
import { AiConsole } from "@/components/admin/ai/AiConsole"
import { ApprovalList } from "@/components/admin/ai/ApprovalList"
import { AgentSettings } from "@/components/admin/ai/AgentSettings"

export function AiDashboardClient({ initialAgents, initialPendingActions }: any) {
    const [agents] = useState(initialAgents)
    const [pendingActions, setPendingActions] = useState(initialPendingActions)

    return (
        <Tabs defaultValue="console" className="space-y-4">
            <TabsList className="bg-primary/5 p-1 border border-primary/10 rounded-xl">
                <TabsTrigger value="console" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-[10px] uppercase tracking-widest px-6 py-2">
                    <MessageSquare className="h-3 w-3" /> Console
                </TabsTrigger>
                <TabsTrigger value="approvals" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-[10px] uppercase tracking-widest px-6 py-2">
                    <ShieldCheck className="h-3 w-3" />
                    Approvals {pendingActions.length > 0 && <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-[8px] text-white animate-pulse font-black">{pendingActions.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-[10px] uppercase tracking-widest px-6 py-2">
                    <Settings2 className="h-3 w-3" /> Agents
                </TabsTrigger>
                <TabsTrigger value="learning" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-[10px] uppercase tracking-widest px-6 py-2">
                    <Activity className="h-3 w-3" /> Training
                </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="space-y-4 outline-none">
                <AiConsole agents={agents} />
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4 outline-none">
                <ApprovalList actions={pendingActions} onActionUpdate={(newList: any) => setPendingActions(newList)} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 outline-none">
                <AgentSettings agents={agents} />
            </TabsContent>

            <TabsContent value="learning" className="space-y-4 outline-none">
                <Card className="border-primary/20 bg-primary/5 border-dashed">
                    <CardHeader>
                        <CardTitle className="font-black italic text-xl uppercase tracking-tighter">Learning & <span className="text-primary">Performance</span></CardTitle>
                        <CardDescription className="text-xs font-semibold uppercase tracking-widest opacity-60">Audit AI suggestions and admin feedback loops.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                        <Activity className="h-12 w-12 text-primary/20 mb-4" />
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest italic">Neural Feedback Loop: INITIALIZING</p>
                        <p className="text-[10px] text-muted-foreground/60 uppercase max-w-xs mt-2">Data is currently being aggregated from AI Actions. Analytics will be available after 100 successful mutations.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}

