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
        <div className="w-80 border-r flex flex-col bg-muted/10 h-full">
            <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Messages</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveTab(activeTab === 'conversations' ? 'users' : 'conversations')}
                        title={activeTab === 'conversations' ? "Start New Chat" : "Back to List"}
                    >
                        {activeTab === 'conversations' ? <Plus className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </Button>
                </div>
                {activeTab !== 'create-group' && (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => setActiveTab('create-group')}
                        >
                            <Users className="h-3 w-3 mr-2" />
                            Create Group
                        </Button>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                {activeTab === 'create-group' ? (
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">New Group</h3>
                            <Input
                                placeholder="Group Name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Add Members</h3>
                            <div className="space-y-1">
                                {availableUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedGroupMembers.includes(user.id) ? 'bg-primary/10' : 'hover:bg-muted'}`}
                                        onClick={() => {
                                            if (selectedGroupMembers.includes(user.id)) {
                                                setSelectedGroupMembers(prev => prev.filter(id => id !== user.id))
                                            } else {
                                                setSelectedGroupMembers(prev => [...prev, user.id])
                                            }
                                        }}
                                    >
                                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedGroupMembers.includes(user.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                            {selectedGroupMembers.includes(user.id) && <div className="h-2 w-2 bg-white rounded-full" />}
                                        </div>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profileImage || undefined} />
                                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-medium">{user.fullName}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setActiveTab('conversations')}>Cancel</Button>
                            <Button
                                className="flex-1"
                                disabled={!newGroupName.trim() || selectedGroupMembers.length === 0 || creatingGroup}
                                onClick={handleCreateGroup}
                            >
                                {creatingGroup && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-0.5 p-2">
                        {loading && (
                            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        )}

                        {!loading && filteredItems.length === 0 && (
                            <div className="text-center p-8 text-muted-foreground text-sm">No results found</div>
                        )}

                        {/* List Items */}
                        {!loading && activeTab === 'conversations' && (
                            <div className="space-y-6">
                                {/* Direct Conversations Section */}
                                {conversations.filter(c => c.type === 'DIRECT' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-3 flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Individual Chat</h3>
                                            <Badge variant="secondary" className="text-[8px] h-3 px-1">
                                                {conversations.filter(c => c.type === 'DIRECT' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).length}
                                            </Badge>
                                        </div>
                                        {conversations.filter(c => c.type === 'DIRECT' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item: any) => (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedConversation?.id === item.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                onClick={() => setSelectedConversation(item)}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={item.image || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{item.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    {item.unreadCount > 0 && (
                                                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="font-bold text-sm truncate">{item.name}</span>
                                                        {item.lastMessage && (
                                                            <span className="text-[9px] font-medium text-muted-foreground">
                                                                {new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <p className="text-xs text-muted-foreground truncate flex-1">
                                                            {item.lastMessage?.content || 'No messages'}
                                                        </p>
                                                        <Badge variant="outline" className="text-[8px] h-3 px-1 border-primary/20 text-primary bg-primary/5 uppercase font-black">Individual</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Group Conversations Section */}
                                {conversations.filter(c => c.type === 'GROUP' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-3 flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Group Chat</h3>
                                            <Badge variant="secondary" className="text-[8px] h-3 px-1">
                                                {conversations.filter(c => c.type === 'GROUP' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).length}
                                            </Badge>
                                        </div>
                                        {conversations.filter(c => c.type === 'GROUP' && c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item: any) => (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedConversation?.id === item.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                onClick={() => setSelectedConversation(item)}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={item.image || undefined} />
                                                        <AvatarFallback className="bg-indigo-500/10 text-indigo-600 font-bold"><Users className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                    {item.unreadCount > 0 && (
                                                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="font-bold text-sm truncate">{item.name}</span>
                                                        {item.lastMessage && (
                                                            <span className="text-[9px] font-medium text-muted-foreground">
                                                                {new Date(item.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2">
                                                        <p className="text-xs text-muted-foreground truncate flex-1">
                                                            {item.lastMessage?.content || 'No messages'}
                                                        </p>
                                                        <Badge variant="outline" className="text-[8px] h-3 px-1 border-indigo-500/20 text-indigo-600 bg-indigo-500/5 uppercase font-black">Group</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
            <DialogContent className="max-w-4xl h-[700px] flex p-0 gap-0 overflow-hidden outline-none">
                <DialogTitle className="sr-only">Chat Hub</DialogTitle>
                {renderSidebar()}
                <div className="flex-1 flex flex-col bg-background h-full">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedConversation.image || undefined} />
                                        <AvatarFallback>{selectedConversation.type === 'GROUP' ? <Users /> : selectedConversation.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-sm uppercase tracking-tight">{selectedConversation.name}</h3>
                                            <Badge
                                                variant="outline"
                                                className={`text-[8px] h-4 px-1 uppercase font-black ${selectedConversation.type === 'GROUP'
                                                        ? 'border-indigo-500/20 text-indigo-600 bg-indigo-500/5'
                                                        : 'border-primary/20 text-primary bg-primary/5'
                                                    }`}
                                            >
                                                {selectedConversation.type === 'GROUP' ? 'Group' : 'Individual'}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                            <span className={`h-1.5 w-1.5 rounded-full ${selectedConversation.type === 'GROUP' ? 'bg-indigo-500' : 'bg-primary'} animate-pulse`} />
                                            {selectedConversation.type === 'GROUP' ? 'Active Group Conversation' : 'Direct Support Connection'}
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
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">or start a new chat to begin</p>
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
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4 bg-muted/30">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === myId
                        // Fallback in case sender is not populated (though it should be now)
                        const senderName = msg.sender?.fullName || 'Unknown'
                        const senderImage = msg.sender?.profileImage

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="h-8 w-8 mt-1">
                                            <AvatarImage src={senderImage || undefined} />
                                            <AvatarFallback>{senderName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        {!isMe && (
                                            <p className="text-xs text-muted-foreground mb-1 ml-1">{senderName}</p>
                                        )}
                                        <div className={`rounded-2xl p-3 text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground rounded-tl-none border'}`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sending} />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                        {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
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
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4 bg-muted/30">
                <div className="space-y-4">
                    {uniqueMessages.map((msg) => {
                        const isMe = msg.senderId === myId
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg.sender.profileImage || undefined} />
                                            <AvatarFallback>{msg.sender.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        {!isMe && (
                                            <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender.fullName}</p>
                                        )}
                                        <div className={`rounded-2xl p-3 text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-card-foreground rounded-tl-none border'}`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sending} />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                        {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
