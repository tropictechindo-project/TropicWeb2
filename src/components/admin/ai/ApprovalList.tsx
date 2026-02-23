"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldCheck, XCircle, CheckCircle2, History, Bot, ArrowRight, Eye } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function ApprovalList({ actions: initialActions, onActionUpdate }: any) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [actions, setActions] = useState(initialActions)

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setIsLoading(id)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/admin/ai/actions/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            toast.success(`Action ${status.toLowerCase()} successfully`)
            const newActions = actions.filter((a: any) => a.id !== id)
            setActions(newActions)
            onActionUpdate(newActions)
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsLoading(null)
        }
    }

    if (actions.length === 0) {
        return (
            <Card className="border-border/50 bg-muted/5">
                <CardContent className="h-64 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Pending AI Proclamations</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-primary/20 bg-background overflow-hidden">
            <CardHeader className="p-6 border-b bg-primary/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase italic tracking-tighter">Pending AI <span className="text-primary">Proposals</span></CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest font-bold opacity-60">Admin review required for database mutation.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-primary/10">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Source Agent</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Mutation Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Confidence</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Submitted</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6">Control</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {actions.map((action: any) => (
                            <TableRow key={action.id} className="group border-primary/5 hover:bg-primary/5 transition-colors">
                                <TableCell className="px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/20 p-2 rounded-lg">
                                            <Bot className="h-3 w-3 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs uppercase tracking-tighter italic">AI-{action.agent.systemName}</p>
                                            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">ACTIVE AGENT</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[9px] font-black px-3 rounded-full border-primary/20 bg-primary/5">
                                        {action.actionType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '85%' }} />
                                        </div>
                                        <span className="text-[10px] font-black italic">85%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[10px] font-medium opacity-60">
                                    {new Date(action.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-primary/20">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl bg-zinc-950 border-primary/20">
                                                <DialogHeader>
                                                    <DialogTitle className="font-black italic uppercase text-lg italic tracking-tighter">Mutation <span className="text-primary">Inspector</span></DialogTitle>
                                                    <DialogDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Action UUID: {action.id}</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Current State</p>
                                                        <div className="bg-background border border-border/50 p-4 rounded-xl text-[11px] font-mono opacity-60 line-through decoration-destructive/50">
                                                            {JSON.stringify(action.payloadBefore || { note: "NO PRIOR STATE RECORDED" }, null, 2)}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Proposed State</p>
                                                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-[11px] font-mono text-primary shadow-inner">
                                                            {JSON.stringify(action.payloadAfter, null, 2)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 flex gap-3">
                                                    <Button
                                                        variant="destructive"
                                                        className="flex-1 font-black uppercase tracking-widest h-10 italic"
                                                        onClick={() => handleAction(action.id, 'REJECTED')}
                                                        disabled={isLoading === action.id}
                                                    >
                                                        Abort Proposal
                                                    </Button>
                                                    <Button
                                                        className="flex-1 font-black uppercase tracking-widest h-10 italic"
                                                        onClick={() => handleAction(action.id, 'APPROVED')}
                                                        disabled={isLoading === action.id}
                                                    >
                                                        Authorize Mutation
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleAction(action.id, 'REJECTED')}
                                            disabled={isLoading === action.id}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            className="h-8 w-8 rounded-lg"
                                            onClick={() => handleAction(action.id, 'APPROVED')}
                                            disabled={isLoading === action.id}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

