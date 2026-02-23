"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SellerChatBubble() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hi! I am Sunny, your Tropic Tech assistant. Looking for the perfect remote setup in Bali?' }
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
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having a bit of trouble connecting to my neural network. Please try again later!' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {isOpen && (
                <Card className="w-[380px] h-[550px] shadow-2xl border-primary/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
                    <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between text-white border-none">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tighter">Tropic Tech Assistant</CardTitle>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">AI Active Now</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-full h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 bg-background overflow-hidden relative">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
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
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Sunny is thinking...</span>
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
                                placeholder="Ask me something about rentals..."
                                className="flex-1 bg-background border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 text-xs transition-all pointer-events-auto"
                            />
                            <Button size="icon" onClick={handleSend} disabled={isLoading} className="rounded-xl h-10 w-10 flex-shrink-0 pointer-events-auto">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto ${isOpen ? 'rotate-90 opacity-0 scale-0' : 'scale-100 rotate-0'}`}
            >
                <div className="relative">
                    <MessageCircle className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                </div>
            </Button>
        </div>
    )
}
