'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, Loader2 } from "lucide-react"

interface AiDashboardPanelProps {
    title: string;
    agentName: string;
    welcomeMessage: string;
    apiRoute: string;
    icon?: React.ReactNode;
}

export function AiDashboardPanel({ title, agentName, welcomeMessage, apiRoute, icon }: AiDashboardPanelProps) {
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: welcomeMessage }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(apiRoute, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: input, history: messages.slice(-4) })
            })

            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'No response.' }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'System error connecting to neural network.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-[500px] shadow-sm border-primary/20 overflow-hidden relative">
            <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                        {icon || <Bot className="h-5 w-5" />}
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-widest">{title}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{agentName} Active</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 bg-background overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4 pb-2">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted/50 border border-border/50 rounded-tl-none font-medium'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted/30 p-3 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60">{agentName} is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-background to-transparent z-10" />
            </CardContent>

            <CardFooter className="p-4 border-t bg-muted/10">
                <div className="flex w-full gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message Assistant..."
                        className="flex-1 bg-background border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 text-xs transition-all pointer-events-auto"
                    />
                    <Button size="icon" onClick={handleSend} disabled={isLoading} className="rounded-xl h-10 w-10 flex-shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
