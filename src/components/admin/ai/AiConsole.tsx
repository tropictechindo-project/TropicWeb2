"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Wand2, ShieldAlert } from "lucide-react"

export function AiConsole({ agents }: any) {
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Neural link established. I am the Master AI Orchestrator. How can I assist you in optimizing TropicWeb today?', agent: 'MASTER' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState('MASTER')
    const scrollEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/admin/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: input,
                    agentName: selectedAgent,
                    history: messages.slice(-5)
                })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply,
                proposal: data.proposal,
                agent: selectedAgent
            }])

        } catch (error) {
            console.error('Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: Neural connection interrupted.', agent: 'SYSTEM' }])
        } finally {
            setIsLoading(false)
        }
    }

    const createProposal = async (proposal: any) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/admin/ai/actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    agentSystemName: selectedAgent,
                    actionType: proposal.actionType,
                    payloadAfter: proposal.payload,
                    payloadBefore: proposal.payloadBefore
                })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `🚀 Mutation Proposal created ID: ${data.action.id.slice(0, 8)}. Please check the Approvals tab.`,
                agent: 'SYSTEM'
            }])
        } catch (e: any) {
            alert(e.message)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[650px]">
            <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
                <CardHeader className="pb-3 border-b border-primary/10">
                    <CardTitle className="text-sm font-black uppercase tracking-widest italic">Active <span className="text-primary">Agents</span></CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-2 space-y-2">
                    {agents.map((agent: any) => (
                        <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent.systemName)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${selectedAgent === agent.systemName
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]'
                                    : 'bg-background hover:bg-primary/10 border-border/50'
                                }`}
                        >
                            <Bot className={`h-4 w-4 ${selectedAgent === agent.systemName ? 'text-white' : 'text-primary'}`} />
                            <div className="text-left overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-tighter truncate leading-tight">AI {agent.systemName}</p>
                                <p className={`text-[9px] truncate opacity-60 leading-tight ${selectedAgent === agent.systemName ? 'text-white' : 'text-muted-foreground'}`}>{agent.displayName}</p>
                            </div>
                        </button>
                    ))}
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 flex flex-col overflow-hidden border-primary/20">
                <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-tighter">AI-{selectedAgent} CONSOLE</CardTitle>
                            <Badge variant="outline" className="text-[8px] font-black h-4 px-2 border-primary/30">SYSTEM LINK: ACTIVE</Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4">
                        <div className="space-y-6">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar className="h-8 w-8 mt-1 border border-border/50 shadow-sm flex-shrink-0">
                                            <AvatarFallback className={m.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-background text-primary'}>
                                                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2">
                                            <div className={`p-4 rounded-2xl text-sm shadow-sm border ${m.role === 'user'
                                                    ? 'bg-primary text-primary-foreground border-primary/50 rounded-tr-none'
                                                    : 'bg-muted/30 border-border/50 rounded-tl-none font-medium text-zinc-300'
                                                }`}>
                                                {m.content}
                                            </div>

                                            {m.proposal && (
                                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl space-y-3 animate-in zoom-in-95 duration-300">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                                        <Wand2 className="h-3 w-3" /> Proposed Mutation
                                                    </div>
                                                    <div className="text-[11px] font-mono bg-background/50 p-2 rounded border border-primary/10 max-h-32 overflow-auto">
                                                        {JSON.stringify(m.proposal.payload, null, 2)}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="w-full text-[10px] font-black uppercase tracking-widest h-8"
                                                        onClick={() => createProposal(m.proposal)}
                                                    >
                                                        Confirm & Queue Proposal
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <Avatar className="h-8 w-8 animate-pulse border border-border/50">
                                            <AvatarFallback className="bg-background text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted/10 border border-dashed border-primary/30 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Neural Processing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollEndRef} />
                        </div>
                    </ScrollArea>

                    {selectedAgent === 'RISK' && (
                        <div className="absolute top-4 right-4 z-10">
                            <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-[10px] px-3 font-black">
                                <ShieldAlert className="h-3 w-3" /> RISK AUDIT ACTIVE
                            </Badge>
                        </div>
                    )}
                </CardContent>

                <div className="p-4 border-t bg-muted/10">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Command AI-${selectedAgent}...`}
                            className="bg-background border-primary/20 focus-visible:ring-primary rounded-xl h-12"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading}
                            className="h-12 w-12 rounded-xl group"
                        >
                            <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
