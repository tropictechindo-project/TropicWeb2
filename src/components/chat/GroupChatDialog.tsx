'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ChatDialog } from '@/components/chat/ChatDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface GroupMessage {
    id: string
    senderId: string
    content: string
    createdAt: string
    sender: {
        id: string
        fullName: string
        profileImage?: string | null
        role: string
    }
}

interface GroupChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    groupId: string
    groupName: string
}

export function GroupChatDialog({
    open,
    onOpenChange,
    groupId,
    groupName,
}: GroupChatDialogProps) {
    const [messages, setMessages] = useState<GroupMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Direct Chat State
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isDirectChatOpen, setIsDirectChatOpen] = useState(false)

    const handleUserClick = (user: any) => {
        if (user.id === userId) return
        setSelectedUser(user)
        setIsDirectChatOpen(true)
    }

    useEffect(() => {
        if (open && groupId) {
            fetchMessages()
            // Poll for new messages every 5 seconds
            pollingRef.current = setInterval(fetchMessages, 5000)

            // Get current user ID from token
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    setUserId(payload.userId)
                } catch (e) {
                    console.error('Failed to parse token')
                }
            }
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [open, groupId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                console.log('GroupChatDialog: No token found')
                return
            }

            const res = await fetch(`/api/groups/${groupId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            console.error('Failed to fetch group messages:', error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                toast.error('Authentication error. Please login again.')
                setSending(false)
                return
            }

            const res = await fetch(`/api/groups/${groupId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newMessage.trim()
                })
            })
            const data = await res.json()
            if (data.success) {
                setMessages([...messages, data.message])
                setNewMessage('')
            } else {
                toast.error('Failed to send message')
            }
        } catch (error) {
            toast.error('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] h-[650px] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b flex flex-row items-center gap-3 space-y-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle>{groupName}</DialogTitle>
                            <p className="text-xs text-muted-foreground">Group Chat</p>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-4 bg-muted/30">
                        <div className="space-y-4">
                            {messages.length === 0 && !loading && (
                                <div className="text-center text-muted-foreground text-sm mt-10">
                                    No messages yet. Start the conversation!
                                </div>
                            )}
                            {messages.length === 0 && !loading && (
                                <div className="text-center text-muted-foreground text-sm mt-10">
                                    No messages yet. Start the conversation!
                                </div>
                            )}
                            {/* Filter out duplicate messages if any */}
                            {Array.from(new Map(messages.map(m => [m.id, m])).values()).map((msg) => {
                                const isMe = msg.senderId === userId
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={msg.sender.profileImage || undefined} />
                                                    <AvatarFallback>{msg.sender.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                {!isMe && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium">{msg.sender.fullName}</span>
                                                        {msg.sender.role !== 'USER' && (
                                                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                                                                {msg.sender.role}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                <div
                                                    className={`rounded-2xl p-3 text-sm shadow-sm ${isMe
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-card text-card-foreground rounded-tl-none border'
                                                        }`}
                                                >
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

                    <div className="p-4 border-t border-muted bg-background">
                        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="bg-muted border-none focus-visible:ring-1"
                                disabled={sending}
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedUser && (
                <ChatDialog
                    open={isDirectChatOpen}
                    onOpenChange={setIsDirectChatOpen}
                    otherUserId={selectedUser.id}
                    otherUserName={selectedUser.fullName}
                    otherUserImage={selectedUser.profileImage}
                />
            )}
        </>
    )
}
