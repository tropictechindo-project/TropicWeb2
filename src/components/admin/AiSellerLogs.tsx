'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, User, Clock, ChevronRight, RefreshCw, Smartphone, Globe, Loader2, Send, Terminal, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'

interface Session {
    id: string
    createdAt: string
    metadata: any
    _count: { messages: number }
    messages: { content: string; createdAt: string }[]
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
}

export function AiSellerLogs() {
    const [sessions, setSessions] = React.useState<Session[]>([])
    const [selectedSession, setSelectedSession] = React.useState<Session | null>(null)
    const [messages, setMessages] = React.useState<Message[]>([])
    const [loading, setLoading] = React.useState(false)
    const [messagesLoading, setMessagesLoading] = React.useState(false)

    React.useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/ai-logs')
            const data = await res.json()
            if (data.success) setSessions(data.sessions)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (sessionId: string) => {
        setMessagesLoading(true)
        try {
            const res = await fetch(`/api/admin/ai-logs?sessionId=${sessionId}`)
            const data = await res.json()
            if (data.success) {
                setMessages(data.messages)
                // Mark notifications for this session as read
                fetch('/api/admin/notifications/mark-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entityId: sessionId, type: 'AI_CHAT' })
                }).catch(err => console.error('Silent notification clear failed:', err))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setMessagesLoading(false)
        }
    }

    const startNewSession = async () => {
        const newSessionId = crypto.randomUUID();
        const dummySession: Session = {
            id: newSessionId,
            createdAt: new Date().toISOString(),
            metadata: { platform: 'Admin Training', type: 'training' },
            _count: { messages: 0 },
            messages: []
        };
        setSessions([dummySession, ...sessions]);
        setSelectedSession(dummySession);
        setMessages([]);
    }

    const deleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this session record?')) return;
        
        try {
            const res = await fetch(`/api/admin/ai-logs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSessions(sessions.filter(s => s.id !== id));
                if (selectedSession?.id === id) {
                    setSelectedSession(null);
                    setMessages([]);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 h-full bg-transparent overflow-hidden">
            {/* Sessions List - Borderless & Fluid */}
            <div className="md:w-80 flex flex-col h-full overflow-hidden border-r border-zinc-100 pr-4">
                <div className="flex items-center justify-between py-4 mb-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" /> Intelligence Stream
                    </h2>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={startNewSession} className="h-7 w-7 text-primary hover:bg-primary/10">
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={loading} className="h-7 w-7 text-zinc-300 hover:text-zinc-600">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
                
                <ScrollArea className="flex-1">
                    <div className="space-y-3 pb-8">
                        {sessions.length === 0 && !loading && (
                            <div className="text-center p-8 space-y-4">
                                <p className="text-zinc-300 text-[9px] font-bold uppercase tracking-widest leading-relaxed">No signals detected</p>
                                <Button size="sm" variant="outline" onClick={startNewSession} className="text-[9px] font-black uppercase border-zinc-100 rounded-xl px-4">
                                    Create Training Link
                                </Button>
                            </div>
                        )}
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => {
                                    setSelectedSession(session)
                                    fetchMessages(session.id)
                                }}
                                className={`group p-4 rounded-2xl cursor-pointer transition-all border relative ${selectedSession?.id === session.id 
                                    ? 'bg-white border-zinc-200 shadow-sm' 
                                    : 'bg-transparent border-transparent hover:bg-zinc-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[7px] font-black uppercase tracking-tighter border-none px-1.5 h-4 ${session.metadata?.type === 'training' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                            {session.metadata?.type === 'training' ? 'TRAINING' : 'CUSTOMER'}
                                        </Badge>
                                        <span className="text-[8px] text-zinc-300 font-bold">#{session.id.slice(0, 4)}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteSession(e, session.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-zinc-500 line-clamp-1 italic font-medium pr-6">
                                    {session.messages?.[0]?.content || 'Initializing link...'}
                                </p>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">
                                        {format(new Date(session.createdAt), 'MMM dd, HH:mm')}
                                    </span>
                                    <span className="text-[8px] text-zinc-300 font-bold">{session._count.messages} MSG</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Conversation View - Expansive & Borderless */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/50 rounded-[2.5rem] border border-zinc-100/50 backdrop-blur-sm relative">
                {selectedSession ? (
                    <>
                        <div className="px-8 py-6 border-b border-zinc-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner ${selectedSession.metadata?.type === 'training' ? 'bg-amber-50 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                    {selectedSession.metadata?.type === 'training' ? <ShieldCheck className="h-5 w-5" /> : <Terminal className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-800">
                                        {selectedSession.metadata?.type === 'training' ? 'Training Module' : 'Customer Audit'}
                                    </h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                        {selectedSession.metadata?.type === 'training' ? 'Active Training Session' : 'Observing User Transmission'}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-zinc-800 text-white border-none font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                                {selectedSession.id}
                            </Badge>
                        </div>
                        
                        <ScrollArea className="flex-1 px-8 py-6">
                            <div className="space-y-8 pb-10">
                                {messages.length === 0 && !messagesLoading && (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                                        <div className="p-6 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                            <Bot className="h-12 w-12 text-zinc-200 animate-pulse" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 italic max-w-[200px] leading-relaxed">
                                            Waiting for first transmission...<br/>You can talk to the AI to train it here.
                                        </p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                                        <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-zinc-100 text-zinc-400' : 'bg-primary text-white'}`}>
                                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </div>
                                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`rounded-3xl p-5 text-xs leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-zinc-100 text-zinc-600 rounded-tr-none border border-zinc-200/50'
                                                    : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none font-medium shadow-zinc-200/20 shadow-xl'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300 mt-3 px-2">
                                                    {format(new Date(msg.createdAt), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {messagesLoading && (
                                    <div className="flex justify-center p-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area - Floats at bottom */}
                        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100">
                            <div className="flex gap-3 bg-zinc-50 p-2 rounded-[2rem] border border-zinc-100 shadow-inner focus-within:border-primary/30 transition-all">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={selectedSession.metadata?.type === 'training' ? "Teach your AI... (Use BossAdmin2026)" : "Intervene or ask AI... (Admin Only)"}
                                    className="flex-1 bg-transparent px-6 py-3 text-xs text-zinc-800 focus:outline-none placeholder:text-zinc-400 font-medium"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if (!val) return;
                                            e.currentTarget.value = '';
                                            
                                            const userMsg: Message = {
                                                id: Math.random().toString(),
                                                role: 'user',
                                                content: val,
                                                createdAt: new Date().toISOString()
                                            };
                                            setMessages(prev => [...prev, userMsg]);
                                            
                                            try {
                                                const res = await fetch('/api/ai/seller', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        message: val, 
                                                        history: messages.slice(-10),
                                                        sessionId: selectedSession.id,
                                                        metadata: { platform: 'Admin Console', type: selectedSession.metadata?.type }
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.reply) {
                                                    const aiMsg: Message = {
                                                        id: Math.random().toString(),
                                                        role: 'assistant',
                                                        content: data.reply,
                                                        createdAt: new Date().toISOString()
                                                    };
                                                    setMessages(prev => [...prev, aiMsg]);
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }
                                    }}
                                />
                                <Button size="icon" className="h-10 w-10 bg-primary hover:bg-primary/80 rounded-full text-white shadow-lg shadow-primary/20">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-12 text-center select-none">
                        <div className="h-24 w-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-zinc-100">
                            <Terminal className="h-10 w-10 text-primary opacity-30 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-[0.4em] italic text-zinc-800 opacity-60">Frequency Sync</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-6 text-zinc-500 max-w-[300px] leading-relaxed">
                            Pick a session to audit or create a new training module to refine AI behavior.
                        </p>
                        <Button variant="outline" onClick={startNewSession} className="mt-10 rounded-full px-10 h-12 border-zinc-200 hover:bg-primary/5 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest">
                            New Training Link
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
