'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MessageSquare, User, Clock } from 'lucide-react'
import { ChatDialog } from '@/components/chat/ChatDialog'
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

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [showChatDialog, setShowChatDialog] = useState(false)

    useEffect(() => {
        fetchConversations()
        const interval = setInterval(fetchConversations, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setConversations(data.conversations)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredConversations = conversations.filter(conv =>
        conv.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Message Center</h1>
                    <p className="text-muted-foreground mt-1">Manage communications with users and workers</p>
                </div>
            </div>

            <Card className="h-[calc(100vh-250px)] flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or role..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading messages...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchQuery ? 'No conversations found matches your search.' : 'No messages yet.'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.user.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors relative",
                                            conv.unreadCount > 0 && "bg-primary/5"
                                        )}
                                        onClick={() => {
                                            setSelectedConversation(conv)
                                            setShowChatDialog(true)
                                        }}
                                    >
                                        <Avatar className="h-12 w-12 shrink-0">
                                            <AvatarImage src={conv.user.profileImage || undefined} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold truncate">{conv.user.fullName}</span>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 lowercase">
                                                        {conv.user.role}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-sm truncate pr-6",
                                                conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                            )}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <Badge variant="destructive" className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] rounded-full shrink-0">
                                                {conv.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {selectedConversation && (
                <ChatDialog
                    open={showChatDialog}
                    onOpenChange={setShowChatDialog}
                    otherUserId={selectedConversation.user.id}
                    otherUserName={selectedConversation.user.fullName}
                    otherUserImage={selectedConversation.user.profileImage}
                />
            )}
        </div>
    )
}
