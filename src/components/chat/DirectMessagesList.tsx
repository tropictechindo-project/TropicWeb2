'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MessageSquare, Loader2, User } from 'lucide-react'
import { ChatDialog } from './ChatDialog'
import { Badge } from '@/components/ui/badge'

interface DirectMessagesListProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface User {
    id: string
    fullName: string
    profileImage?: string | null
    role: string
}

interface Conversation {
    user: User
    lastMessage?: {
        content: string
        createdAt: string
        isRead: boolean
        senderId: string
    }
    unreadCount: number
}

export function DirectMessagesList({ open, onOpenChange }: DirectMessagesListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // State for opening a specific chat
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [myId, setMyId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchConversations()
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    setMyId(payload.userId)
                } catch (e) {
                    console.error('Failed to parse token')
                }
            }
        }
    }, [open])

    const fetchConversations = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return

            // 1. Fetch conversations (users I've chatted with)
            console.log('Fetching conversations...')
            const res = await fetch('/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            console.log('Conversations data:', data)

            if (data.success) {
                setConversations(data.conversations)
            }
        } catch (error) {
            console.error('Failed to fetch conversations', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUserSelect = (user: User) => {
        setSelectedUser(user)
        setIsChatOpen(true)
    }

    const filteredConversations = conversations.filter(c =>
        c.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Direct Messages</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 pb-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search messages..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-2">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>No conversations found</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.user.id}
                                        className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                                        onClick={() => handleUserSelect(conv.user)}
                                    >
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={conv.user.profileImage || undefined} />
                                                <AvatarFallback>{conv.user.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium truncate">{conv.user.fullName}</span>
                                                {conv.lastMessage && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {conv.lastMessage?.senderId === myId && 'You: '}
                                                    {conv.lastMessage?.content || 'No messages'}
                                                </p>
                                                {conv.user.role !== 'USER' && (
                                                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                                                        {conv.user.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Nested Chat Dialog */}
            {selectedUser && (
                <ChatDialog
                    open={isChatOpen}
                    onOpenChange={(open) => {
                        setIsChatOpen(open)
                        if (!open) fetchConversations() // Refresh list on close
                    }}
                    otherUserId={selectedUser.id}
                    otherUserName={selectedUser.fullName}
                    otherUserImage={selectedUser.profileImage}
                />
            )}
        </>
    )
}
