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
    role?: 'ADMIN' | 'OPERATOR' | 'WORKER' | 'USER';
    context?: Record<string, any>;
}

export function AiDashboardPanel({ title, agentName, welcomeMessage, apiRoute, icon, role, context }: AiDashboardPanelProps) {
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
                body: JSON.stringify({
                    message: input,
                    history: messages.slice(-4),
                    role,
                    context
                })
            })

            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.response || data.error || 'No response.' }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'System error connecting to neural network.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-[600px] border-none shadow-2xl overflow-hidden relative bg-zinc-950 text-white rounded-[2rem]">
            {/* Glossy Header */}
            <CardHeader className="bg-white/5 pb-6 border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-2xl text-primary shadow-lg shadow-primary/10">
                        {icon || <Bot className="h-6 w-6" />}
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-white/90">{title}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{agentName} IS ONLINE</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 bg-transparent overflow-hidden relative">
                <ScrollArea className="h-full p-6">
                    <div className="space-y-6 pb-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none font-bold'
                                    : 'bg-white/5 border border-white/10 rounded-tl-none font-medium text-zinc-200 backdrop-blur-sm'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl rounded-tl-none flex items-center gap-3 backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">{agentName} is generating...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                {/* Visual accents */}
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />
            </CardContent>

            <CardFooter className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="flex w-full gap-3">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Ask ${agentName} anything...`}
                        className="flex-1 bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl px-5 py-3 text-sm transition-all pointer-events-auto text-white placeholder:text-zinc-500 font-medium"
                    />
                    <Button size="icon" onClick={handleSend} disabled={isLoading} className="rounded-2xl h-12 w-12 flex-shrink-0 bg-primary hover:bg-primary/80 text-white shadow-xl shadow-primary/20 transition-transform active:scale-95">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
