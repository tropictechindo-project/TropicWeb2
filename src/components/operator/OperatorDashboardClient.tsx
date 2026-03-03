"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    LayoutDashboard, FileText, Truck, Package, Users, Bot,
    CheckCircle, Clock, AlertTriangle, TrendingUp, Send, Loader2,
    ChevronRight, RefreshCw, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
    operatorName: string
    stats: { pendingPayments: number; queuedDeliveries: number; activeOrders: number; lowStockCount: number }
    pendingInvoices: any[]
    deliveries: any[]
    orders: any[]
    variants: any[]
    workers: any[]
}

type Tab = 'overview' | 'invoices' | 'deliveries' | 'inventory' | 'ai'

export default function OperatorDashboardClient({
    operatorName, stats, pendingInvoices, deliveries, orders, variants, workers
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [aiInput, setAiInput] = useState('')
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
        { role: 'ai', text: `Hi ${operatorName}! I'm your Operator AI assistant. I can help you manage stock, prioritize deliveries, summarize orders, and more. What do you need?` }
    ])
    const [aiLoading, setAiLoading] = useState(false)
    const [confirmingInvoice, setConfirmingInvoice] = useState<string | null>(null)

    const sendAiMessage = async () => {
        if (!aiInput.trim()) return
        const userMsg = aiInput.trim()
        setAiInput('')
        setAiMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setAiLoading(true)
        try {
            const res = await fetch('/api/ai/operator-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}` },
                body: JSON.stringify({ message: userMsg, context: { stats, pendingInvoicesCount: pendingInvoices.length } })
            })
            const data = await res.json()
            setAiMessages(prev => [...prev, { role: 'ai', text: data.response || 'I could not process that request.' }])
        } catch {
            setAiMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }])
        } finally {
            setAiLoading(false)
        }
    }

    const confirmPayment = async (invoiceId: string) => {
        setConfirmingInvoice(invoiceId)
        try {
            const token = document.cookie.split('token=')[1]?.split(';')[0]
            const res = await fetch(`/api/invoices/${invoiceId}/confirm-payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invoiceId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`✅ Payment confirmed! Order ${data.orderNumber} created. ${data.itemsReserved} item(s) reserved.`)
        } catch (err: any) {
            toast.error(err.message || 'Failed to confirm payment')
        } finally {
            setConfirmingInvoice(null)
        }
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'deliveries', label: 'Deliveries', icon: Truck },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'ai', label: 'AI Assistant', icon: Bot },
    ] as const

    const statCards = [
        { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Queued Deliveries', value: stats.queuedDeliveries, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Orders', value: stats.activeOrders, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Low Stock Items', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ]

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'bg-orange-500/10 text-orange-600 border-orange-200',
            PAID: 'bg-green-500/10 text-green-600 border-green-200',
            QUEUED: 'bg-blue-500/10 text-blue-600 border-blue-200',
            CLAIMED: 'bg-purple-500/10 text-purple-600 border-purple-200',
            OUT_FOR_DELIVERY: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            COMPLETED: 'bg-green-500/10 text-green-700 border-green-200',
            AWAITING_PAYMENT: 'bg-orange-500/10 text-orange-600 border-orange-200',
            ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        }
        return colors[status] || 'bg-muted text-muted-foreground'
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight">⚡ Operator Console</h1>
                        <p className="text-xs text-muted-foreground">Welcome back, {operatorName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-primary">OPERATOR</Badge>
                        <Button variant="ghost" size="icon" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                </div>
                {/* Tab Navigation */}
                <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0.5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statCards.map(card => (
                                <div key={card.label} className="bg-card border rounded-2xl p-5 space-y-3">
                                    <div className={`inline-flex p-2.5 rounded-xl ${card.bg}`}>
                                        <card.icon className={`h-5 w-5 ${card.color}`} />
                                    </div>
                                    <div>
                                        <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{card.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Invoices needing action */}
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-sm font-black uppercase tracking-widest">Pending Payments</h2>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')} className="text-xs">
                                    View All <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            {pendingInvoices.slice(0, 5).length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">All caught up! No pending payments.</div>
                            ) : (
                                <div className="divide-y">
                                    {pendingInvoices.slice(0, 5).map((inv: any) => (
                                        <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                                            <div>
                                                <p className="font-mono text-sm font-bold">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-muted-foreground">{inv.user?.fullName || inv.guestName || 'Guest'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-sm">Rp {Number(inv.total).toLocaleString('id-ID')}</span>
                                                <Button
                                                    size="sm"
                                                    className="text-xs h-7 font-bold"
                                                    onClick={() => confirmPayment(inv.id)}
                                                    disabled={confirmingInvoice === inv.id}
                                                >
                                                    {confirmingInvoice === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Confirm Paid'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Deliveries */}
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-sm font-black uppercase tracking-widest">Live Deliveries</h2>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('deliveries')} className="text-xs">
                                    View All <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                            {deliveries.slice(0, 5).length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">No active deliveries right now.</div>
                            ) : (
                                <div className="divide-y">
                                    {deliveries.slice(0, 5).map((d: any) => (
                                        <div key={d.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                                            <div>
                                                <p className="font-mono text-xs font-bold">{d.trackingCode || 'No code yet'}</p>
                                                <p className="text-xs text-muted-foreground">{d.invoice?.user?.fullName || d.invoice?.guestName || 'Guest'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-[9px] border ${getStatusColor(d.status)}`}>{d.status}</Badge>
                                                {d.claimedByWorker && <span className="text-xs text-muted-foreground">→ {d.claimedByWorker.fullName}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* INVOICES */}
                {activeTab === 'invoices' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Invoice Management</h2>
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {pendingInvoices.map((inv: any) => (
                                            <tr key={inv.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3 font-mono text-xs font-bold">{inv.invoiceNumber}</td>
                                                <td className="px-4 py-3 text-xs">{inv.user?.fullName || inv.guestName || 'Guest'}<br /><span className="text-muted-foreground">{inv.user?.email || inv.guestEmail}</span></td>
                                                <td className="px-4 py-3 font-bold text-xs">Rp {Number(inv.total).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3"><Badge className={`text-[9px] border ${getStatusColor(inv.status)}`}>{inv.status}</Badge></td>
                                                <td className="px-4 py-3">
                                                    {inv.status === 'PENDING' && (
                                                        <Button size="sm" className="h-7 text-xs font-bold" onClick={() => confirmPayment(inv.id)} disabled={confirmingInvoice === inv.id}>
                                                            {confirmingInvoice === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Mark Paid'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pendingInvoices.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No pending invoices.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* DELIVERIES */}
                {activeTab === 'deliveries' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Delivery Control</h2>
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tracking</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Worker</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vehicle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {deliveries.map((d: any) => (
                                            <tr key={d.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3 font-mono text-xs font-bold">{d.trackingCode || '—'}</td>
                                                <td className="px-4 py-3 text-xs">{d.invoice?.user?.fullName || d.invoice?.guestName || 'Guest'}</td>
                                                <td className="px-4 py-3"><Badge className={`text-[9px] border ${getStatusColor(d.status)}`}>{d.status.replace(/_/g, ' ')}</Badge></td>
                                                <td className="px-4 py-3 text-xs">{d.claimedByWorker?.fullName || <span className="text-muted-foreground italic">Unassigned</span>}</td>
                                                <td className="px-4 py-3 text-xs">{d.vehicle?.name || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {deliveries.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No active deliveries.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* INVENTORY */}
                {activeTab === 'inventory' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Inventory Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variants.slice(0, 24).map((v: any) => {
                                const available = v.units?.length || 0
                                return (
                                    <div key={v.id} className={`bg-card border rounded-xl p-4 ${available === 0 ? 'border-red-200' : ''}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-bold text-sm">{v.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{v.color} · SKU: {v.sku}</p>
                                            </div>
                                            <Badge className={`text-[9px] border ${available === 0 ? 'bg-red-500/10 text-red-600 border-red-200' : available <= 2 ? 'bg-orange-500/10 text-orange-600 border-orange-200' : 'bg-green-500/10 text-green-600 border-green-200'}`}>
                                                {available === 0 ? '⚠ OUT' : `${available} avail`}
                                            </Badge>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* AI ASSISTANT */}
                {activeTab === 'ai' && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
                                <Bot className="w-7 h-7 text-primary" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Operator AI Assistant</h2>
                            <p className="text-xs text-muted-foreground mt-1">Ask about orders, stock, delivery priorities, or operational summaries.</p>
                        </div>

                        {/* Chat window */}
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="h-[400px] overflow-y-auto p-4 space-y-3 flex flex-col">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted rounded-bl-sm'
                                            }`}>
                                            {msg.role === 'ai' && <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 block mb-1">AI OPERATOR</span>}
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {aiLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t p-3 flex gap-2">
                                <Input
                                    placeholder="Ask about stock levels, pending orders, delivery status..."
                                    value={aiInput}
                                    onChange={e => setAiInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                                    className="flex-1 text-sm"
                                />
                                <Button onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()} size="icon">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Quick prompts */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                'Summary of today\'s pending orders',
                                'Which products are out of stock?',
                                'How many deliveries are queued?',
                                'What needs urgent attention?',
                            ].map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => { setAiInput(prompt); }}
                                    className="text-left p-3 bg-card border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-2"
                                >
                                    <ChevronRight className="h-3 w-3 shrink-0" />
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
