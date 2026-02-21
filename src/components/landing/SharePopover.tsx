'use client'

import { useState } from 'react'
import { Share2, Link as LinkIcon, Check, MessageCircle, Facebook, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'

interface SharePopoverProps {
    title: string
    text: string
    url: string
}

export function SharePopover({ title, text, url }: SharePopoverProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success("Link copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Failed to copy link")
        }
    }

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'text-green-500',
            href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'text-blue-600',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        },
        {
            name: 'Telegram',
            icon: Send,
            color: 'text-sky-500',
            href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        }
    ]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Share">
                    <Share2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 shadow-xl border-primary/10" align="end">
                <div className="space-y-3">
                    <h4 className="font-medium text-sm leading-none mb-2">Share this item</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {shareLinks.map((link) => (
                            <Button
                                key={link.name}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start h-9"
                                onClick={() => window.open(link.href, '_blank')}
                            >
                                <link.icon className={`h-4 w-4 mr-2 ${link.color}`} />
                                <span className="text-xs">{link.name}</span>
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-9"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                                <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            )}
                            <span className="text-xs">{copied ? "Copied!" : "Copy Link"}</span>
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
