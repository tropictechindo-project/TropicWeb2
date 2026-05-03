'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

    // Forwarding List State
    const [forwardEmails, setForwardEmails] = useState<string[]>([])
    const [newEmail, setNewEmail] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const fetchForwardEmails = async () => {
        try {
            const res = await fetch('/api/admin/settings/email-forward')
            if (res.ok) {
                const data = await res.json()
                setForwardEmails(data.emails || [])
            }
        } catch (e) { console.error(e) }
    }

    const handleAddEmail = async () => {
        const trimmed = newEmail.trim()
        if (!trimmed || !trimmed.includes('@')) {
            toast.error("Invalid email address")
            return
        }
        if (forwardEmails.length >= 10) {
            toast.error("Maximum 10 emails allowed")
            return
        }
        if (forwardEmails.includes(trimmed)) {
            toast.error("Email already in list")
            return
        }
        
        setIsSaving(true)
        const updated = [...forwardEmails, trimmed]
        try {
            const res = await fetch('/api/admin/settings/email-forward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: updated })
            })
            if (res.ok) {
                setForwardEmails(updated)
                setNewEmail('')
                toast.success("Forward email added")
            }
        } catch { toast.error("Failed to update") }
        finally { setIsSaving(false) }
    }

    const handleRemoveEmail = async (email: string) => {
        setIsSaving(true)
        const updated = forwardEmails.filter(e => e !== email)
        try {
            const res = await fetch('/api/admin/settings/email-forward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: updated })
            })
            if (res.ok) {
                setForwardEmails(updated)
                toast.success("Forward email removed")
            }
        } catch { toast.error("Failed to update") }
        finally { setIsSaving(false) }
    }

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
        fetchForwardEmails()
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
            
            {/* ADMIN GUIDE (AU) */}
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Mail className="w-4 h-4" /> ADMIN COMMAND: EMAIL AUDIT (AU)
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1 text-amber-800 dark:text-amber-300 font-medium">
                    <p>No worries mate! Here's how to manage the comms:</p>
                    <p>• <b>Auto-Forward:</b> You can set up to 10 emails to receive copies of all invoices. Perfect for keeping the bookkeeper happy, cheers.</p>
                    <p>• <b>Audit Logs:</b> Every single email sent by the system is logged below. If a customer says they didn't get their bill, check here first.</p>
                    <p>• <b>Preview:</b> Click any email in the list to see exactly what went out. No more guessing games, mate.</p>
                </CardContent>
            </Card>

            {/* Email Forward Management Card Node flawless safely */}
            <Card className="shadow-lg border-border/40 bg-accent/5">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> AUTO INVOICE EMAIL FORWARDING (Max 10)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Add email to forward list..." 
                            className="max-w-xs text-xs h-9" 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)} 
                        />
                        <Button size="sm" className="h-9 font-bold text-xs" onClick={handleAddEmail} disabled={isSaving}>ADD</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {forwardEmails.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No automatic forwards configured.</p>
                        ) : (
                            forwardEmails.map((email, idx) => (
                                <Badge key={idx} variant="secondary" className="gap-1 pl-2 pr-1 h-7 text-xs font-medium">
                                    {email}
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 p-0 hover:bg-destructive/10 text-destructive" 
                                        onClick={() => handleRemoveEmail(email)}
                                        disabled={isSaving}
                                    >
                                        <AlertCircle className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

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
