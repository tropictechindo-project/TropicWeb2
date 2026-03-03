"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    LayoutDashboard, FileText, Truck, Package, Bot,
    Clock, AlertTriangle, TrendingUp, Send, Loader2,
    ChevronRight, RefreshCw, ArrowRight, BarChart3, Activity,
    Download
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

type Tab = 'overview' | 'invoices' | 'deliveries' | 'inventory' | 'report' | 'logs' | 'ai'

function getToken() {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
    return match ? match[1] : ''
}

export default function OperatorDashboardClient({
    operatorName, stats, pendingInvoices, deliveries, orders, variants, workers
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview')

    // AI state
    const [aiInput, setAiInput] = useState('')
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
        { role: 'ai', text: `Hi ${operatorName}! I'm your Operator AI assistant. I can help you manage stock, prioritize deliveries, summarize orders, and more. What do you need?` }
    ])
    const [aiLoading, setAiLoading] = useState(false)

    // Invoice confirmation state
    const [confirmingInvoice, setConfirmingInvoice] = useState<string | null>(null)

    // Report state
    const [report, setReport] = useState<any>(null)
    const [reportLoading, setReportLoading] = useState(false)

    // Logs state
    const [logs, setLogs] = useState<any[]>([])
    const [logsLoading, setLogsLoading] = useState(false)
    const [logsEntity, setLogsEntity] = useState('')

    // ─── Helpers ───────────────────────────────────────────────────────────────

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
        return colors[status] || 'bg-muted/30 text-muted-foreground border-muted'
    }

    const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
    const fmtDate = (d: any) => d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—'

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            ADMIN: 'text-red-600', OPERATOR: 'text-purple-600',
            WORKER: 'text-blue-600', USER: 'text-green-600', SYSTEM: 'text-muted-foreground'
        }
        return colors[role] || 'text-muted-foreground'
    }

    // ─── Actions ───────────────────────────────────────────────────────────────

    const sendAiMessage = async () => {
        if (!aiInput.trim()) return
        const userMsg = aiInput.trim()
        setAiInput('')
        setAiMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setAiLoading(true)
        try {
            const res = await fetch('/api/ai/operator-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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

    const confirmPayment = async (invoiceId: string, invoiceNumber: string) => {
        setConfirmingInvoice(invoiceId)
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/confirm-payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ invoiceId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`✅ Payment confirmed! Order ${data.orderNumber} created. ${data.itemsReserved} item(s) reserved.`)
            // Refresh page data after confirmation
            setTimeout(() => window.location.reload(), 1500)
        } catch (err: any) {
            toast.error(err.message || 'Failed to confirm payment')
        } finally {
            setConfirmingInvoice(null)
        }
    }

    const loadReport = useCallback(async () => {
        setReportLoading(true)
        try {
            const res = await fetch('/api/operator/report', {
                headers: { Authorization: `Bearer ${getToken()}` }
            })
            if (!res.ok) throw new Error('Failed to load report')
            setReport(await res.json())
        } catch (err: any) {
            toast.error(err.message || 'Could not load report')
        } finally {
            setReportLoading(false)
        }
    }, [])

    const loadLogs = useCallback(async (entity?: string) => {
        setLogsLoading(true)
        try {
            const params = new URLSearchParams({ limit: '100' })
            if (entity) params.set('entity', entity)
            const res = await fetch(`/api/operator/logs?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            })
            if (!res.ok) throw new Error('Failed to load logs')
            setLogs(await res.json())
        } catch (err: any) {
            toast.error(err.message || 'Could not load logs')
        } finally {
            setLogsLoading(false)
        }
    }, [])

    // Auto-load when switching tabs
    useEffect(() => {
        if (activeTab === 'report' && !report) loadReport()
        if (activeTab === 'logs' && logs.length === 0) loadLogs()
    }, [activeTab, report, logs.length, loadReport, loadLogs])

    const exportCSV = () => {
        if (!report?.invoices?.length) return
        const headers = ['Invoice', 'Customer', 'Email', 'Subtotal', 'Tax', 'DeliveryFee', 'Total', 'Status', 'Payment', 'Order', 'Delivery', 'Worker', 'Date']
        const rows = report.invoices.map((inv: any) => [
            inv.invoiceNumber, inv.customer, inv.email, inv.subtotal, inv.tax,
            inv.deliveryFee, inv.total, inv.status, inv.paymentMethod,
            inv.orderNumber, inv.delivery, inv.worker,
            new Date(inv.date).toLocaleDateString('id-ID')
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `operator-report-${Date.now()}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    // ─── Tabs ──────────────────────────────────────────────────────────────────

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'deliveries', label: 'Deliveries', icon: Truck },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'report', label: 'Report', icon: BarChart3 },
        { id: 'logs', label: 'Activity Log', icon: Activity },
        { id: 'ai', label: 'AI Assistant', icon: Bot },
    ] as const

    const statCards = [
        { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Queued Deliveries', value: stats.queuedDeliveries, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Orders', value: stats.activeOrders, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Low Stock Items', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ]

    // ─── Render ────────────────────────────────────────────────────────────────

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
                <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="h-3 w-3" />{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* ═══ OVERVIEW ═══════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {statCards.map(card => (
                                <div key={card.label} className="bg-card border rounded-2xl p-5 space-y-3">
                                    <div className={`inline-flex p-2.5 rounded-xl ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
                                    <div>
                                        <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{card.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-sm font-black uppercase tracking-widest">Pending Payments</h2>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('invoices')} className="text-xs">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </div>
                            {pendingInvoices.slice(0, 5).length === 0
                                ? <div className="p-8 text-center text-muted-foreground text-sm">All caught up! No pending payments.</div>
                                : <div className="divide-y">
                                    {pendingInvoices.slice(0, 5).map((inv: any) => (
                                        <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                                            <div>
                                                <p className="font-mono text-sm font-bold">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-muted-foreground">{inv.user?.fullName || inv.guestName || 'Guest'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-sm">{fmt(Number(inv.total))}</span>
                                                <Button size="sm" className="text-xs h-7 font-bold" onClick={() => confirmPayment(inv.id, inv.invoiceNumber)} disabled={confirmingInvoice === inv.id}>
                                                    {confirmingInvoice === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Confirm Paid'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>

                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="text-sm font-black uppercase tracking-widest">Live Deliveries</h2>
                                <Button variant="ghost" size="sm" onClick={() => setActiveTab('deliveries')} className="text-xs">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </div>
                            {deliveries.slice(0, 5).length === 0
                                ? <div className="p-8 text-center text-muted-foreground text-sm">No active deliveries right now.</div>
                                : <div className="divide-y">
                                    {deliveries.slice(0, 5).map((d: any) => (
                                        <div key={d.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30">
                                            <div>
                                                <p className="font-mono text-xs font-bold">{d.trackingCode || 'No code'}</p>
                                                <p className="text-xs text-muted-foreground">{d.invoice?.user?.fullName || d.invoice?.guestName || 'Guest'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-[9px] border ${getStatusColor(d.status)}`}>{d.status}</Badge>
                                                {d.claimedByWorker && <span className="text-xs text-muted-foreground">→ {d.claimedByWorker.fullName}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                )}

                {/* ═══ INVOICES ═══════════════════════════════════════════════════════ */}
                {activeTab === 'invoices' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Invoice Management</h2>
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            {['Invoice', 'Customer', 'Amount', 'Status', 'Action'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {pendingInvoices.map((inv: any) => (
                                            <tr key={inv.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3 font-mono text-xs font-bold">{inv.invoiceNumber}</td>
                                                <td className="px-4 py-3 text-xs">{inv.user?.fullName || inv.guestName || 'Guest'}<br /><span className="text-muted-foreground">{inv.user?.email || inv.guestEmail}</span></td>
                                                <td className="px-4 py-3 font-bold text-xs">{fmt(Number(inv.total))}</td>
                                                <td className="px-4 py-3"><Badge className={`text-[9px] border ${getStatusColor(inv.status)}`}>{inv.status}</Badge></td>
                                                <td className="px-4 py-3">
                                                    {inv.status === 'PENDING' && (
                                                        <Button size="sm" className="h-7 text-xs font-bold" onClick={() => confirmPayment(inv.id, inv.invoiceNumber)} disabled={confirmingInvoice === inv.id}>
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

                {/* ═══ DELIVERIES ═════════════════════════════════════════════════════ */}
                {activeTab === 'deliveries' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Delivery Control</h2>
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            {['Tracking', 'Customer', 'Status', 'Worker', 'Vehicle'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                                            ))}
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

                {/* ═══ INVENTORY ══════════════════════════════════════════════════════ */}
                {activeTab === 'inventory' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-black uppercase tracking-tight">Inventory Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variants.slice(0, 30).map((v: any) => {
                                const available = v.units?.length || 0
                                return (
                                    <div key={v.id} className={`bg-card border rounded-xl p-4 ${available === 0 ? 'border-red-200 dark:border-red-900/50' : ''}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-bold text-sm">{v.product?.name}</p>
                                                <p className="text-xs text-muted-foreground">{v.color} · {v.sku}</p>
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

                {/* ═══ REPORT (Live Spreadsheet) ══════════════════════════════════════ */}
                {activeTab === 'report' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Operator Report</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Live data from database — invoices, revenue, inventory & deliveries</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={loadReport} disabled={reportLoading}>
                                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${reportLoading ? 'animate-spin' : ''}`} />Refresh
                                </Button>
                                <Button size="sm" onClick={exportCSV} disabled={!report?.invoices?.length}>
                                    <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
                                </Button>
                            </div>
                        </div>

                        {reportLoading && (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {report && !reportLoading && (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Revenue (Paid)', value: fmt(report.summary.totalRevenue), color: 'text-green-600' },
                                        { label: 'This Month', value: fmt(report.summary.monthRevenue), color: 'text-blue-600' },
                                        { label: 'Total Tax Collected (2%)', value: fmt(report.summary.totalTax), color: 'text-purple-600' },
                                        { label: 'Total Delivery Fees', value: fmt(report.summary.totalDeliveryFees), color: 'text-orange-600' },
                                    ].map(c => (
                                        <div key={c.label} className="bg-card border rounded-xl p-4 space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.label}</p>
                                            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Delivery Stats */}
                                <div className="bg-card border rounded-2xl p-5 space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Delivery Status Breakdown</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {report.deliveryStats.map((ds: any) => (
                                            <div key={ds.status} className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${getStatusColor(ds.status)}`}>
                                                {ds.status.replace(/_/g, ' ')}: {ds._count.id}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Full Invoice Spreadsheet */}
                                <div className="bg-card border rounded-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest">Invoice Ledger ({report.invoices.length} records)</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="border-b bg-muted/30">
                                                <tr>
                                                    {['Invoice #', 'Customer', 'Subtotal', 'Tax (2%)', 'Delivery', 'Total', 'Method', 'Order #', 'Order Status', 'Delivery', 'Worker', 'Date'].map(h => (
                                                        <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-widest text-[9px] text-muted-foreground whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {report.invoices.map((inv: any) => (
                                                    <tr key={inv.id} className="hover:bg-muted/20">
                                                        <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">{inv.invoiceNumber}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate" title={inv.customer}>{inv.customer}</td>
                                                        <td className="px-3 py-2 text-right whitespace-nowrap">{fmt(inv.subtotal)}</td>
                                                        <td className="px-3 py-2 text-right whitespace-nowrap text-blue-600">{fmt(inv.tax)}</td>
                                                        <td className="px-3 py-2 text-right whitespace-nowrap text-orange-600">{fmt(inv.deliveryFee)}</td>
                                                        <td className="px-3 py-2 text-right whitespace-nowrap font-bold text-green-600">{fmt(inv.total)}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{inv.paymentMethod}</td>
                                                        <td className="px-3 py-2 font-mono whitespace-nowrap">{inv.orderNumber}</td>
                                                        <td className="px-3 py-2"><Badge className={`text-[9px] border ${getStatusColor(inv.orderStatus)}`}>{inv.orderStatus}</Badge></td>
                                                        <td className="px-3 py-2"><Badge className={`text-[9px] border ${getStatusColor(inv.delivery)}`}>{inv.delivery.replace(/_/g, ' ')}</Badge></td>
                                                        <td className="px-3 py-2 whitespace-nowrap">{inv.worker}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{fmtDate(inv.date)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 bg-muted/30">
                                                <tr className="font-black">
                                                    <td className="px-3 py-3 text-xs" colSpan={2}>TOTAL ({report.invoices.length} invoices)</td>
                                                    <td className="px-3 py-3 text-right text-xs">{fmt(report.invoices.reduce((s: number, i: any) => s + i.subtotal, 0))}</td>
                                                    <td className="px-3 py-3 text-right text-xs text-blue-600">{fmt(report.summary.totalTax)}</td>
                                                    <td className="px-3 py-3 text-right text-xs text-orange-600">{fmt(report.summary.totalDeliveryFees)}</td>
                                                    <td className="px-3 py-3 text-right text-xs text-green-600">{fmt(report.summary.totalRevenue)}</td>
                                                    <td colSpan={6}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                        {report.invoices.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No paid invoices yet.</div>}
                                    </div>
                                </div>

                                {/* Inventory Matrix */}
                                <div className="bg-card border rounded-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b">
                                        <h3 className="text-sm font-black uppercase tracking-widest">Stock Matrix</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="border-b bg-muted/30">
                                                <tr>
                                                    {['Product', 'Category', 'SKU', 'Color', 'Available', 'Reserved', 'In Use', 'Maintenance', 'Total'].map(h => (
                                                        <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-widest text-[9px] text-muted-foreground whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {report.inventory.map((v: any, i: number) => (
                                                    <tr key={i} className={`hover:bg-muted/20 ${v.available === 0 ? 'bg-red-50 dark:bg-red-950/10' : ''}`}>
                                                        <td className="px-3 py-2 font-bold">{v.product}</td>
                                                        <td className="px-3 py-2 text-muted-foreground">{v.category}</td>
                                                        <td className="px-3 py-2 font-mono">{v.sku}</td>
                                                        <td className="px-3 py-2">{v.color}</td>
                                                        <td className={`px-3 py-2 font-bold ${v.available === 0 ? 'text-red-600' : 'text-green-600'}`}>{v.available}</td>
                                                        <td className="px-3 py-2 text-orange-600">{v.reserved}</td>
                                                        <td className="px-3 py-2 text-blue-600">{v.inUse}</td>
                                                        <td className="px-3 py-2 text-yellow-600">{v.maintenance}</td>
                                                        <td className="px-3 py-2 font-bold">{v.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ ACTIVITY LOG ═══════════════════════════════════════════════════ */}
                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Activity Log</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">All system actions — orders, invoices, deliveries, inventory changes</p>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="text-xs border rounded-lg px-3 py-2 bg-card"
                                    value={logsEntity}
                                    onChange={e => { setLogsEntity(e.target.value); loadLogs(e.target.value || undefined) }}
                                >
                                    <option value="">All Events</option>
                                    {['INVOICE', 'ORDER', 'DELIVERY', 'UNIT', 'USER', 'PAYMENT'].map(e => (
                                        <option key={e} value={e}>{e}</option>
                                    ))}
                                </select>
                                <Button variant="outline" size="sm" onClick={() => loadLogs(logsEntity || undefined)} disabled={logsLoading}>
                                    <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-card border rounded-2xl overflow-hidden">
                            {logsLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="border-b bg-muted/30">
                                            <tr>
                                                {['Time', 'User', 'Role', 'Action', 'Entity', 'Details'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-widest text-[9px] text-muted-foreground whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {logs.map((log: any) => (
                                                <tr key={log.id} className="hover:bg-muted/20">
                                                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono">{fmtDate(log.date || log.createdAt)}</td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap font-bold">{log.user || 'System'}</td>
                                                    <td className={`px-4 py-2.5 whitespace-nowrap font-black text-[9px] uppercase ${getRoleColor(log.role || log.user?.role)}`}>{log.role || log.user?.role || 'SYSTEM'}</td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-black">{log.action}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                                        <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-bold">{log.entity}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 max-w-xs truncate text-muted-foreground" title={log.details || ''}>{log.details || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {logs.length === 0 && !logsLoading && (
                                        <div className="p-8 text-center text-muted-foreground text-sm">No activity logs found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ AI ASSISTANT ═══════════════════════════════════════════════════ */}
                {activeTab === 'ai' && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
                                <Bot className="w-7 h-7 text-primary" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Operator AI Assistant</h2>
                            <p className="text-xs text-muted-foreground mt-1">Ask about orders, stock, delivery priorities, or operational summaries.</p>
                        </div>

                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="h-[400px] overflow-y-auto p-4 space-y-3 flex flex-col">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted rounded-bl-sm'
                                            }`}>
                                            {msg.role === 'ai' && <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 block mb-1">AI OPERATOR</span>}
                                            <span className="whitespace-pre-wrap">{msg.text}</span>
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

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                "Summary of today's pending orders",
                                'Which products are out of stock?',
                                'How many deliveries are queued?',
                                'What needs urgent attention?',
                            ].map(prompt => (
                                <button key={prompt} onClick={() => setAiInput(prompt)}
                                    className="text-left p-3 bg-card border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-2"
                                >
                                    <ChevronRight className="h-3 w-3 shrink-0" />{prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
