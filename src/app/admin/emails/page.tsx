'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface EmailLog {
    id: string
    to: string
    subject: string
    body: string | null
    status: string
    invoiceId: string | null
    createdAt: string
}

export default function EmailAuditPage() {
    const [emails, setEmails] = useState<EmailLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)

    const fetchEmails = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/emails', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch emails')
            const data = await res.json()
            setEmails(data)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load email audit logs')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmails()
    }, [])

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Email Audit Logs</h1>
                    <p className="text-muted-foreground text-sm">Review all automatic and triggered emails sent from the system.</p>
                </div>
                <Button onClick={fetchEmails} disabled={isLoading} variant="outline" size="sm">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Email List */}
                <Card className="lg:col-span-1 shadow-xl border-border/40">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Emails</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                        ) : emails.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No email logs found.</div>
                        ) : (
                            <ScrollArea className="h-[600px] divide-y divide-border/10">
                                {emails.map((email) => (
                                    <button
                                        key={email.id}
                                        onClick={() => setSelectedEmail(email)}
                                        className={`w-full text-left p-4 hover:bg-accent/30 transition-colors flex flex-col gap-1 border-b last:border-0 ${selectedEmail?.id === email.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-bold text-sm truncate max-w-[150px]">{email.to}</span>
                                            <Badge variant={email.status === 'SENT' ? 'default' : 'destructive'} className="text-[9px] px-1 h-4">
                                                {email.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium">{email.subject}</p>
                                        <span className="text-[9px] text-muted-foreground mt-1">
                                            {new Date(email.createdAt).toLocaleString()}
                                        </span>
                                    </button>
                                ))}
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Email Preview */}
                <Card className="lg:col-span-2 shadow-xl border-border/40">
                    <CardHeader className="bg-muted/30 border-b border-border/10">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {selectedEmail ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 border-b pb-4 text-xs">
                                    <div className="text-muted-foreground">To:</div>
                                    <div className="col-span-2 font-bold">{selectedEmail.to}</div>
                                    <div className="text-muted-foreground">Subject:</div>
                                    <div className="col-span-2 font-bold">{selectedEmail.subject}</div>
                                    <div className="text-muted-foreground">Time:</div>
                                    <div className="col-span-2">{new Date(selectedEmail.createdAt).toLocaleString()}</div>
                                    {selectedEmail.invoiceId && (
                                        <>
                                            <div className="text-muted-foreground">Invoice ID:</div>
                                            <div className="col-span-2 flex items-center gap-1 text-primary">
                                                <span className="truncate max-w-[150px]">{selectedEmail.invoiceId}</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Body Render */}
                                <div className="mt-4 border rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                    {selectedEmail.body ? (
                                        <iframe
                                            srcDoc={selectedEmail.body}
                                            title="Email Preview"
                                            className="w-full h-[400px] border-none"
                                            sandbox="allow-same-origin"
                                        />
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-sm">Body content missing or pure text.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                                <Mail className="h-12 w-12 opacity-10 mb-3" />
                                <p className="text-sm">Select an email log to preview content</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
