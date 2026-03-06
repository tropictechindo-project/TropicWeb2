"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Bot, Loader2, Sparkles } from "lucide-react"

export function SellerChatBubble() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hi! I am T-TechAi, your Tropic Tech AI assistant. Looking for the perfect remote setup in Bali?' }
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
            const response = await fetch('/api/ai/seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history: messages.slice(-4) })
            })

            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having a bit of trouble connecting. Please try again later!' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[380px] h-[550px] shadow-2xl border-zinc-800/50 bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto text-white">
                    {/* Header */}
                    <CardHeader className="bg-zinc-900 p-4 flex flex-row items-center justify-between border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-xl">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tighter text-white">T-TechAi</CardTitle>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">AI Active</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/10 rounded-full h-8 w-8"
                            aria-label="Close T-TechAi chat"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 p-0 bg-zinc-950 overflow-hidden relative">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${m.role === 'user'
                                            ? 'bg-white text-zinc-900 rounded-tr-none font-semibold'
                                            : 'bg-zinc-800 border border-zinc-700 rounded-tl-none text-zinc-100'
                                            }`}>
                                            {m.role === 'assistant' && (
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">T-Tech.Ai</p>
                                            )}
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">T-Tech.Ai is thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="p-4 border-t border-zinc-800 bg-zinc-900">
                        <div className="flex w-full gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask T-Tech.Ai about rentals..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 transition-all pointer-events-auto"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={isLoading}
                                className="rounded-xl h-10 w-10 flex-shrink-0 bg-white hover:bg-zinc-100 text-zinc-900 pointer-events-auto"
                                aria-label="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            {/* Trigger Button — "T-Tech.Ai" name integrated inside the button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Open T-Tech.Ai AI Assistant"
                className={`pointer-events-auto flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 rounded-full shadow-2xl border border-zinc-700 transition-all duration-300 ${isOpen ? 'opacity-0 scale-0 pointer-events-none absolute' : 'opacity-100 scale-100'}`}
            >
                <div className="relative">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                </div>
                <span className="text-sm font-black uppercase tracking-tighter whitespace-nowrap">T-Tech.Ai</span>
            </button>
        </div>
    )
}
