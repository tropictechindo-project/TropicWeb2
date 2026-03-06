'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, MessageSquare, User, Clock, Users, ArrowRight } from 'lucide-react'
import { ChatDialog } from '@/components/chat/ChatDialog'
import { GroupChatDialog } from '@/components/chat/GroupChatDialog'
import { cn } from '@/lib/utils'

interface Conversation {
    user: {
        id: string
        fullName: string
        profileImage: string | null
        role: string
    }
    lastMessage: string
    lastMessageAt: string
    unreadCount: number
}

interface Group {
    id: string
    name: string
    type: string
    messages: any[]
    members: any[]
    updatedAt: string
}

export function UnifiedMessagingHub() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Dialog states
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [showChatDialog, setShowChatDialog] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string } | null>(null)
    const [showGroupDialog, setShowGroupDialog] = useState(false)

    useEffect(() => {
        fetchAllMessages()
        const interval = setInterval(fetchAllMessages, 15000)
        return () => clearInterval(interval)
    }, [])

    const fetchAllMessages = async () => {
        try {
            const token = localStorage.getItem('token')
            const [convRes, groupRes] = await Promise.all([
                fetch('/api/messages/conversations', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } })
            ])

            const convData = await convRes.json()
            const groupData = await groupRes.json()

            if (convData.success) setConversations(convData.conversations)
            if (groupData.success) setGroups(groupData.groups)
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredConversations = conversations.filter(conv =>
        conv.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const fmtDate = (d: string) => {
        const date = new Date(d)
        const now = new Date()
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search messages or groups..."
                    className="pl-10 h-10 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs defaultValue="direct" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="direct" className="rounded-lg text-xs font-bold uppercase tracking-wider">
                        Direct Messages
                        {conversations.some(c => c.unreadCount > 0) && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="rounded-lg text-xs font-bold uppercase tracking-wider">
                        Group Support
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="flex-1 overflow-hidden mt-2 p-0">
                    <ScrollArea className="h-[500px] border rounded-2xl bg-card">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold tracking-widest">Initialising Comms...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold tracking-widest">No signals found.</div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.user.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-all border-l-4 border-transparent",
                                            conv.unreadCount > 0 && "bg-primary/5 border-l-primary"
                                        )}
                                        onClick={() => {
                                            setSelectedConversation(conv)
                                            setShowChatDialog(true)
                                        }}
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                                            <AvatarImage src={conv.user.profileImage || undefined} />
                                            <AvatarFallback className="bg-primary/5"><User className="w-5 h-5 text-primary/40" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm truncate">{conv.user.fullName}</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 font-black uppercase tracking-tighter opacity-70">
                                                        {conv.user.role}
                                                    </Badge>
                                                </div>
                                                <span className="text-[9px] font-black text-muted-foreground whitespace-nowrap">
                                                    {fmtDate(conv.lastMessageAt)}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-xs truncate",
                                                conv.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground opacity-80"
                                            )}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] rounded-full shrink-0 font-black">
                                                {conv.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="groups" className="flex-1 overflow-hidden mt-2 p-0">
                    <ScrollArea className="h-[500px] border rounded-2xl bg-card">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold tracking-widest">Loading Support Hub...</div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs uppercase font-bold tracking-widest">No support tickets.</div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {filteredGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-all border-l-4 border-transparent"
                                        onClick={() => {
                                            setSelectedGroup({ id: group.id, name: group.name })
                                            setShowGroupDialog(true)
                                        }}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border-2 border-primary/10">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm truncate">{group.name}</span>
                                                    {group.type === 'USER_SUPPORT' && (
                                                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/50 text-[9px] font-black uppercase px-1 h-4">Support</Badge>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black text-muted-foreground whitespace-nowrap">
                                                    {fmtDate(group.updatedAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground opacity-80 truncate">
                                                {group.messages?.[0]?.content || 'Click to view support ticket'}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            {selectedConversation && (
                <ChatDialog
                    open={showChatDialog}
                    onOpenChange={setShowChatDialog}
                    otherUserId={selectedConversation.user.id}
                    otherUserName={selectedConversation.user.fullName}
                    otherUserImage={selectedConversation.user.profileImage}
                />
            )}

            {selectedGroup && (
                <GroupChatDialog
                    open={showGroupDialog}
                    onOpenChange={setShowGroupDialog}
                    groupId={selectedGroup.id}
                    groupName={selectedGroup.name}
                />
            )}
        </div>
    )
}
