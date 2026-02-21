'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
    id: string
    senderId: string
    receiverId: string
    content: string
    createdAt: string
    isRead: boolean
}

interface ChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    otherUserId: string
    otherUserName: string
    otherUserImage?: string | null
}

export function ChatDialog({
    open,
    onOpenChange,
    otherUserId,
    otherUserName,
    otherUserImage,
}: ChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Current user context (minimal)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        if (open && otherUserId) {
            fetchMessages()
            // Start polling every 5 seconds
            pollingRef.current = setInterval(fetchMessages, 5000)

            // Get current user ID from token (base64 decode)
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
    }, [open, otherUserId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                console.log('ChatDialog: No token found, skipping fetch')
                return
            }
            console.log('ChatDialog: Fetching messages with token:', token.substring(0, 10) + '...')
            const res = await fetch(`/api/messages?userId=${otherUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('ChatDialog: Sending message...', { newMessage, sending, otherUserId })
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                console.error('ChatDialog: No token for sending')
                toast.error('Authentication error. Please login again.')
                setSending(false)
                return
            }
            console.log('ChatDialog: Posting to API...')
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverId: otherUserId,
                    content: newMessage.trim()
                })
            })
            const data = await res.json()
            console.log('ChatDialog: POST response:', data)
            if (data.success) {
                setMessages([...messages, data.message])
                setNewMessage('')
            } else {
                console.error('ChatDialog: Send failed:', data.error)
                toast.error(`Failed to send: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('ChatDialog: Fetch error:', error)
            toast.error('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b flex flex-row items-center gap-3 space-y-0">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUserImage || undefined} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div>
                        <DialogTitle>{otherUserName}</DialogTitle>
                        <p className="text-xs text-muted-foreground">Messaging System</p>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4 bg-muted/30">
                    <div className="space-y-4">
                        {messages.length === 0 && !loading && (
                            <div className="text-center text-muted-foreground text-sm mt-10">
                                No messages yet. Start the conversation!
                            </div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.senderId === userId
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${isMe
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
                            )
                        })}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-muted bg-background">
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
