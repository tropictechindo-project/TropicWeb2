'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Loader2, Plus, MessageSquare, Users, X, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SupportChatHubProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultSupportGroupId?: string // Optional: open this group by default
}

interface User {
    id: string
    fullName: string
    profileImage?: string | null
    role: string
}

interface Conversation {
    id: string
    type: 'DIRECT' | 'GROUP'
    name: string
    image?: string | null
    lastMessage?: {
        content: string
        createdAt: string
        senderId: string
    }
    unreadCount: number
    data: any // Full user or group object
}

export function SupportChatHub({ open, onOpenChange, defaultSupportGroupId }: SupportChatHubProps) {
    const [activeTab, setActiveTab] = useState<'conversations' | 'users' | 'create-group'>('conversations')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [availableUsers, setAvailableUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [myId, setMyId] = useState<string | null>(null)

    // Selection State
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

    // New Group State
    const [newGroupName, setNewGroupName] = useState('')
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
    const [creatingGroup, setCreatingGroup] = useState(false)

    useEffect(() => {
        if (open) {
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    setMyId(payload.userId)
                } catch (e) {
                    console.error('Failed to parse token')
                }
            }
            fetchConversations()
            fetchAvailableUsers()
        }
    }, [open])

    useEffect(() => {
        if (defaultSupportGroupId && conversations.length > 0 && !selectedConversation) {
            const supportConv = conversations.find(c => c.data.id === defaultSupportGroupId)
            if (supportConv) {
                setSelectedConversation(supportConv)
            }
        }
    }, [defaultSupportGroupId, conversations])

    const fetchAvailableUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            // Fetch Workers AND Admins
            const [workersRes, adminsRes] = await Promise.all([
                fetch('/api/users/workers', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users/admins', { headers: { 'Authorization': `Bearer ${token}` } })
            ])

            const workersData = await workersRes.json()
            const adminsData = await adminsRes.json()

            let users: User[] = []
            if (workersData.workers) users = [...users, ...workersData.workers]
            if (adminsData.admins) users = [...users, ...adminsData.admins]

            // Deduplicate by ID
            const uniqueUsers = Array.from(new Map(users.map(item => [item.id, item])).values())

            // Filter out self
            if (myId) {
                setAvailableUsers(uniqueUsers.filter(u => u.id !== myId))
            } else {
                setAvailableUsers(uniqueUsers)
            }

        } catch (error) {
            console.error('Failed to fetch users', error)
        }
    }

    const fetchConversations = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            // Fetch Direct Messages
            const dmRes = await fetch('/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const dmData = await dmRes.json()

            // Fetch Groups
            const groupsRes = await fetch('/api/groups', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const groupsData = await groupsRes.json()

            const allConversations: Conversation[] = []

            if (dmData.success && dmData.conversations) {
                dmData.conversations.forEach((c: any) => {
                    allConversations.push({
                        id: c.user.id,
                        type: 'DIRECT',
                        name: c.user.fullName,
                        image: c.user.profileImage,
                        lastMessage: c.lastMessage,
                        unreadCount: c.unreadCount,
                        data: c.user
                    })
                })
            }

            if (groupsData.success && groupsData.groups) {
                groupsData.groups.forEach((g: any) => {
                    allConversations.push({
                        id: g.id,
                        type: 'GROUP',
                        name: g.name,
                        image: null, // Groups don't have images yet
                        lastMessage: g.messages?.[0] ? {
                            content: g.messages[0].content,
                            createdAt: g.messages[0].createdAt,
                            senderId: '' // We might not have this in list view
                        } : undefined,
                        unreadCount: 0,
                        data: g
                    })
                })
            }

            // Sort by latest message
            allConversations.sort((a, b) => {
                const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
                const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
                return dateB - dateA
            })

            setConversations(allConversations)
        } catch (error) {
            console.error('Failed to fetch data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedGroupMembers.length === 0) return

        setCreatingGroup(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newGroupName,
                    type: 'WORKER_GROUP',
                    memberIds: selectedGroupMembers
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Group created!')
                setActiveTab('conversations')
                setNewGroupName('')
                setSelectedGroupMembers([])
                fetchConversations()
            } else {
                toast.error(data.error || 'Failed to create group')
            }
        } catch (error) {
            toast.error('Failed to create group')
        } finally {
            setCreatingGroup(false)
        }
    }


    const filteredItems = activeTab === 'conversations'
        ? conversations.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : activeTab === 'users'
            ? availableUsers.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
            : availableUsers

    const renderSidebar = () => (
        <div className={`w-full sm:w-80 border-r border-zinc-800 flex flex-col bg-zinc-950 h-full ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-6 border-b border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-black text-xl tracking-tighter uppercase italic text-white">Ask-Me Hub</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl"
                        onClick={() => setActiveTab(activeTab === 'conversations' ? 'users' : 'conversations')}
                    >
                        {activeTab === 'conversations' ? <Plus className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </Button>
                </div>
                {activeTab !== 'create-group' && (
                    <div className="relative group">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find connections..."
                            className="pl-10 h-10 bg-white/5 border-zinc-800 focus-visible:ring-primary/50 rounded-xl text-xs font-medium text-white placeholder:text-zinc-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 px-2">
                {activeTab === 'create-group' ? (
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Secure Channel Name</h3>
                            <Input
                                placeholder="Alpha Group..."
                                className="bg-white/5 border-zinc-800 text-white rounded-xl h-10"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Select Operators</h3>
                            <div className="space-y-1">
                                {availableUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedGroupMembers.includes(user.id) ? 'bg-primary/20 border-primary/20' : 'hover:bg-white/5'}`}
                                        onClick={() => {
                                            if (selectedGroupMembers.includes(user.id)) {
                                                setSelectedGroupMembers(prev => prev.filter(id => id !== user.id))
                                            } else {
                                                setSelectedGroupMembers(prev => [...prev, user.id])
                                            }
                                        }}
                                    >
                                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedGroupMembers.includes(user.id) ? 'bg-primary border-primary' : 'border-zinc-700'}`}>
                                            {selectedGroupMembers.includes(user.id) && <div className="h-2 w-2 bg-white rounded-full" />}
                                        </div>
                                        <Avatar className="h-8 w-8 border border-zinc-800">
                                            <AvatarImage src={user.profileImage || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-400">{user.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-bold text-zinc-200">{user.fullName}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{user.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Button variant="outline" className="flex-1 bg-transparent border-zinc-800 text-zinc-400 hover:text-white rounded-xl" onClick={() => setActiveTab('conversations')}>CANCEL</Button>
                            <Button
                                className="flex-1 rounded-xl font-black bg-primary hover:bg-primary/80"
                                disabled={!newGroupName.trim() || selectedGroupMembers.length === 0 || creatingGroup}
                                onClick={handleCreateGroup}
                            >
                                {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CREATE'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 p-2">
                        {/* Always visible Ask-Me AI Option */}
                        <div
                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-4 relative overflow-hidden group border border-primary/20 bg-primary/5 hover:bg-primary/10`}
                            onClick={() => {
                                if (onOpenChange) onOpenChange(false);
                            }}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                                <Bot className="w-12 h-12 text-primary" />
                            </div>
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full border-[3px] border-zinc-950 animate-pulse" />
                            </div>
                            <div className="flex-1 relative z-10 text-left">
                                <h3 className="font-black text-xs uppercase tracking-widest text-white">Ask-Me Neural</h3>
                                <p className="text-[9px] font-bold text-primary italic uppercase tracking-wider">AI Assistant Online</p>
                            </div>
                        </div>

                        {loading && (
                            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        )}

                        {!loading && filteredItems.length === 0 && (
                            <div className="text-center p-8 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Zero Encrypted Channels</div>
                        )}

                        {/* List Items */}
                        {!loading && activeTab === 'conversations' && (
                            <div className="space-y-1">
                                {conversations.map((item: any) => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedConversation?.id === item.id ? 'bg-white/10 border-white/10 shadow-xl' : 'hover:bg-white/5'}`}
                                        onClick={() => setSelectedConversation(item)}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border-2 border-zinc-950 shadow-lg">
                                                <AvatarImage src={item.image || undefined} />
                                                <AvatarFallback className={`${item.type === 'GROUP' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-primary/20 text-primary'} font-black text-lg`}>
                                                    {item.type === 'GROUP' ? <Users className="h-5 w-5" /> : item.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {item.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-[3px] border-zinc-950 flex items-center justify-center text-[8px] font-black text-white">{item.unreadCount}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center mb-1 text-left">
                                                <span className="font-black text-[11px] uppercase tracking-tight text-white truncate pr-2">{item.name}</span>
                                                {item.lastMessage && (
                                                    <span className="text-[8px] font-black text-zinc-500 uppercase shrink-0">
                                                        {new Date(item.lastMessage.createdAt).getHours()}:{new Date(item.lastMessage.createdAt).getMinutes().toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center gap-3">
                                                <p className="text-[9px] text-zinc-500 truncate flex-1 font-medium italic opacity-70 text-left">
                                                    {item.lastMessage?.content || 'Awaiting transmission...'}
                                                </p>
                                                <Badge variant="outline" className={`text-[7px] h-3 px-1 border-none font-black uppercase tracking-widest ${item.type === 'GROUP' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-primary/10 text-primary'}`}>
                                                    {item.type === 'GROUP' ? 'Group' : 'Direct'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && activeTab === 'users' && filteredItems.map((user: any) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted"
                                onClick={() => {
                                    // Check if conversation already exists
                                    const existing = conversations.find(c => c.type === 'DIRECT' && c.id === user.id)
                                    if (existing) {
                                        setSelectedConversation(existing)
                                    } else {
                                        // Create temp conversation structure for UI immediately
                                        setSelectedConversation({
                                            id: user.id,
                                            type: 'DIRECT',
                                            name: user.fullName,
                                            image: user.profileImage,
                                            unreadCount: 0,
                                            data: user
                                        })
                                    }
                                    setActiveTab('conversations')
                                }}
                            >
                                <Avatar>
                                    <AvatarImage src={user.profileImage || undefined} />
                                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <span className="font-medium text-sm block">{user.fullName}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 mt-1">{user.role}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] sm:max-w-5xl h-[95dvh] sm:h-[750px] flex flex-col sm:flex-row p-0 gap-0 overflow-hidden outline-none w-full sm:w-auto rounded-none sm:rounded-[2.5rem] border-none bg-zinc-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                <DialogTitle className="sr-only">Ask-Me Hub</DialogTitle>
                {renderSidebar()}
                <div className={`flex-1 flex flex-col bg-zinc-900/50 backdrop-blur-3xl h-full ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <div className="flex flex-col h-full w-full">
                            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" className="sm:hidden -ml-2 text-zinc-400 hover:bg-white/5" onClick={() => setSelectedConversation(null)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-zinc-950 shadow-xl">
                                            <AvatarImage src={selectedConversation.image || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-black">{selectedConversation.type === 'GROUP' ? <Users /> : selectedConversation.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-[3px] border-zinc-950 shadow-sm shadow-green-500/50" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-xs uppercase tracking-[0.15em] text-white">{selectedConversation.name}</h3>
                                            <Badge
                                                variant="outline"
                                                className={`text-[8px] h-4 px-2 uppercase font-black border-none tracking-widest ${selectedConversation.type === 'GROUP'
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : 'bg-primary/20 text-primary'
                                                    }`}
                                            >
                                                {selectedConversation.type === 'GROUP' ? 'Group Secure' : 'Neural Direct'}
                                            </Badge>
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-bold flex items-center gap-1.5 uppercase mt-1 tracking-widest italic">
                                            <Bot className="w-3 h-3 text-primary animate-pulse" /> Verified Logistics encrypted frequency
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden relative">
                                {selectedConversation.type === 'DIRECT' ? (
                                    <InlineChat
                                        otherUserId={selectedConversation.id}
                                        myId={myId}
                                    />
                                ) : (
                                    <InlineGroupChat
                                        groupId={selectedConversation.id}
                                        myId={myId}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-12 text-center select-none">
                            <div className="h-40 w-40 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/10 animate-pulse relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                                <MessageSquare className="h-20 w-20 opacity-20 text-primary relative z-10" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-white/40 italic">Neural Connection Hub</h3>
                            <p className="max-w-[320px] text-[10px] font-black leading-relaxed mt-6 opacity-30 uppercase tracking-[0.2em]">Select a secure frequency to synchronize real-time logistics transmission.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InlineChat({ otherUserId, myId }: { otherUserId: string, myId: string | null }) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchMessages()
        pollingRef.current = setInterval(fetchMessages, 5000)
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [otherUserId])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const res = await fetch(`/api/messages?userId=${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setMessages(data.messages)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return
        setSending(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receiverId: otherUserId, content: newMessage.trim() })
            })
            const data = await res.json()
            if (data.success) {
                setMessages([...messages, data.message])
                setNewMessage('')
            }
        } catch (error) {
            toast.error('Failed to send')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-md">
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === myId
                        const senderName = msg.sender?.fullName || 'Secure Node'
                        const senderImage = msg.sender?.profileImage

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="h-9 w-9 border-2 border-zinc-800 shadow-xl mt-1">
                                            <AvatarImage src={senderImage || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-500 font-bold">{senderName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-3xl p-4 text-xs leading-relaxed shadow-lg ${isMe
                                            ? 'bg-primary text-white rounded-tr-none font-bold'
                                            : 'bg-white/5 border border-white/10 text-zinc-200 rounded-tl-none font-medium backdrop-blur-sm'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2 px-1">
                                            {new Date(msg.createdAt).getHours()}:{new Date(msg.createdAt).getMinutes().toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-6 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl">
                <form onSubmit={handleSend} className="flex gap-3">
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Neural message encrypted..."
                        disabled={sending}
                        className="flex-1 bg-white/5 border-white/10 text-white rounded-2xl h-12 px-5 font-medium focus-visible:ring-primary/50 placeholder:text-zinc-600"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending} className="rounded-2xl h-12 w-12 bg-primary hover:bg-primary/80 text-white shadow-xl shadow-primary/20 transition-transform active:scale-95">
                        {sending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}

function InlineGroupChat({ groupId, myId }: { groupId: string, myId: string | null }) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchMessages()
        pollingRef.current = setInterval(fetchMessages, 5000)
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [groupId])

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setMessages(data.messages)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return
        setSending(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/groups/${groupId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: newMessage.trim() })
            })
            const data = await res.json()
            if (data.success) {
                setMessages([...messages, data.message])
                setNewMessage('')
            }
        } catch (error) {
            toast.error('Failed to send')
        } finally {
            setSending(false)
        }
    }

    // Deduplicate messages
    const uniqueMessages = Array.from(new Map(messages.map(m => [m.id, m])).values())

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-md">
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    {uniqueMessages.map((msg) => {
                        const isMe = msg.senderId === myId
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="h-9 w-9 border-2 border-zinc-800 shadow-xl mt-1">
                                            <AvatarImage src={msg.sender.profileImage || undefined} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-500 font-bold">{msg.sender.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-3xl p-4 text-xs leading-relaxed shadow-lg ${isMe
                                            ? 'bg-primary text-white rounded-tr-none font-bold'
                                            : 'bg-white/5 border border-white/10 text-zinc-200 rounded-tl-none font-medium backdrop-blur-sm'}`}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-2 px-1">
                                            {new Date(msg.createdAt).getHours()}:{new Date(msg.createdAt).getMinutes().toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-6 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl">
                <form onSubmit={handleSend} className="flex gap-3">
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Neural message encrypted..."
                        disabled={sending}
                        className="flex-1 bg-white/5 border-white/10 text-white rounded-2xl h-12 px-5 font-medium focus-visible:ring-primary/50 placeholder:text-zinc-600"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending} className="rounded-2xl h-12 w-12 bg-primary hover:bg-primary/80 text-white shadow-xl shadow-primary/20 transition-transform active:scale-95">
                        {sending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
