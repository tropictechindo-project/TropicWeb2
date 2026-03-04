"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    LayoutDashboard, FileText, Truck, Package, Bot,
    Clock, AlertTriangle, TrendingUp, Send, Loader2,
    ChevronRight, RefreshCw, ArrowRight, BarChart3, Activity,
    Download, ListOrdered, LogOut
} from 'lucide-react'
import { toast } from 'sonner'
import { OrdersClient } from "@/components/admin/orders/OrdersClient"
import { DeliveriesClient } from "@/components/admin/deliveries/DeliveriesClient"
import { InventoryClient } from "@/components/admin/inventory/InventoryClient"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { OperatorSidebar } from "@/components/operator/OperatorSidebar"

interface Props {
    operatorName: string
    stats: { pendingPayments: number; queuedDeliveries: number; activeOrders: number; lowStockCount: number }
    pendingInvoices: any[]
    deliveries: any[]
    orders: any[]
    variants: any[]
    workers: any[]
}

type Tab = 'overview' | 'orders' | 'invoices' | 'deliveries' | 'inventory' | 'report' | 'logs' | 'ai' | 'create' | 'logout'

function getToken() {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/)
    return match ? match[1] : ''
}

/** Safe fetch — always returns JSON or throws an Error. Never crashes on HTML error pages. */
async function safeFetch(url: string, opts?: RequestInit) {
    const token = getToken()
    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts?.headers ?? {}),
        },
    })
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
        throw new Error(`Server error ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
    return data
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

    // ─── Create Invoice state ───────────────────────────────────────────────────
    const [createForm, setCreateForm] = useState({
        customerName: '', email: '', whatsapp: '', address: '', notes: '', paymentMethod: 'BANK_TRANSFER'
    })
    const [createItems, setCreateItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([])
    const [createLoading, setCreateLoading] = useState(false)
    const [availableProducts, setAvailableProducts] = useState<any[]>([])
    const [productsLoaded, setProductsLoaded] = useState(false)

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
            const data = await safeFetch('/api/ai/operator-chat', {
                method: 'POST',
                body: JSON.stringify({ message: userMsg, context: { stats, pendingInvoicesCount: pendingInvoices.length } })
            })
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
            const data = await safeFetch(`/api/invoices/${invoiceId}/confirm-payment`, {
                method: 'PATCH',
                body: JSON.stringify({ invoiceId })
            })
            toast.success(`✅ Payment confirmed! Order ${data.orderNumber} created. ${data.itemsReserved} item(s) reserved.`)
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
            setReport(await safeFetch('/api/operator/report'))
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
            setLogs(await safeFetch(`/api/operator/logs?${params}`))
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
        { id: 'orders', label: 'Orders', icon: ListOrdered },
        { id: 'create', label: '+ Create Invoice', icon: FileText },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'deliveries', label: 'Deliveries', icon: Truck },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'report', label: 'Report', icon: BarChart3 },
        { id: 'logs', label: 'Activity Log', icon: Activity },
        { id: 'ai', label: 'AI Assistant', icon: Bot },
        { id: 'logout', label: 'Log Out', icon: LogOut },
    ] as const

    const statCards = [
        { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Queued Deliveries', value: stats.queuedDeliveries, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Orders', value: stats.activeOrders, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Low Stock Items', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    ]

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <SidebarProvider>
            <OperatorSidebar currentTab={activeTab} onTabChange={(t) => setActiveTab(t as Tab)} />
            <SidebarInset className="bg-background min-h-screen">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <div className="flex flex-col ml-2">
                            <h1 className="text-lg font-black uppercase tracking-tight leading-tight">⚡ Operator Console</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-primary">OPERATOR</Badge>
                        <Button variant="ghost" size="icon" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 max-w-7xl mx-auto w-full">

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
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">Delivery Control</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Manage dispatch, track couriers, and override statuses.</p>
                                </div>
                            </div>
                            <div className="w-full">
                                <DeliveriesClient initialDeliveries={deliveries} workers={workers} />
                            </div>
                        </div>
                    )}

                    {/* ═══ ORDERS ═════════════════════════════════════════════════════════ */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">Orders Management</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Confirm payments and manage customer orders like an Admin.</p>
                                </div>
                            </div>
                            <div className="w-full">
                                <OrdersClient initialOrders={orders} />
                            </div>
                        </div>
                    )}

                    {/* ═══ INVENTORY ══════════════════════════════════════════════════════ */}
                    {/* ═══ INVENTORY ══════════════════════════════════════════════════════ */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-black uppercase tracking-tight">Stock Management</h2>
                            <InventoryClient products={variants.map(v => v.product)} variants={variants} />
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
                    {/* ═══ CREATE INVOICE ══════════════════════════════════════════════════ */}
                    {activeTab === 'create' && (() => {
                        // Load products on tab open
                        if (!productsLoaded) {
                            setProductsLoaded(true)
                            safeFetch('/api/products').then((data: any) => {
                                setAvailableProducts(Array.isArray(data) ? data : data.products || [])
                            }).catch(() => { })
                        }

                        const addItem = (product: any) => {
                            const existing = createItems.find(i => i.id === product.id)
                            if (existing) {
                                setCreateItems(prev => prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
                            } else {
                                setCreateItems(prev => [...prev, { id: product.id, name: product.name, price: Number(product.monthlyPrice || product.price || 0), qty: 1 }])
                            }
                        }

                        const removeItem = (id: string) => setCreateItems(prev => prev.filter(i => i.id !== id))

                        const subtotal = createItems.reduce((s, i) => s + i.price * i.qty, 0)

                        const handleCreateInvoice = async () => {
                            if (!createForm.customerName || !createForm.email || !createForm.whatsapp || !createForm.address) {
                                toast.error('Please fill in all customer fields')
                                return
                            }
                            if (createItems.length === 0) {
                                toast.error('Add at least one product')
                                return
                            }
                            setCreateLoading(true)
                            try {
                                const data = await safeFetch('/api/orders', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        items: createItems.flatMap(i => Array(i.qty).fill({ id: i.id, price: i.price, name: i.name })),
                                        paymentMethod: createForm.paymentMethod,
                                        deliveryAddress: createForm.address,
                                        notes: createForm.notes,
                                        guestInfo: {
                                            fullName: createForm.customerName,
                                            email: createForm.email,
                                            whatsapp: createForm.whatsapp,
                                        }
                                    })
                                })
                                const inv = data.invoice || data
                                toast.success(`✅ Invoice ${inv.invoiceNumber || inv.id} created successfully!`)
                                setCreateForm({ customerName: '', email: '', whatsapp: '', address: '', notes: '', paymentMethod: 'BANK_TRANSFER' })
                                setCreateItems([])
                                setTimeout(() => window.location.reload(), 1500)
                            } catch (err: any) {
                                toast.error(err.message || 'Failed to create invoice')
                            } finally {
                                setCreateLoading(false)
                            }
                        }

                        return (
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Left: Customer Info */}
                                <div className="space-y-4">
                                    <div className="bg-card border rounded-2xl p-5 space-y-4">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Customer Info</h2>
                                        {([
                                            { key: 'customerName', label: 'Full Name', placeholder: 'John Doe' },
                                            { key: 'email', label: 'Email', placeholder: 'john@email.com' },
                                            { key: 'whatsapp', label: 'WhatsApp', placeholder: '+628...' },
                                            { key: 'address', label: 'Delivery Address', placeholder: 'Jl. Pantai Berawa...' },
                                        ] as const).map(field => (
                                            <div key={field.key} className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{field.label}</label>
                                                <input
                                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                    placeholder={field.placeholder}
                                                    value={createForm[field.key]}
                                                    onChange={e => setCreateForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Method</label>
                                            <select
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                value={createForm.paymentMethod}
                                                onChange={e => setCreateForm(f => ({ ...f, paymentMethod: e.target.value }))}
                                            >
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="CASH">Cash</option>
                                                <option value="QRIS">QRIS</option>
                                                <option value="CREDIT_CARD">Credit Card</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes (optional)</label>
                                            <textarea
                                                rows={2}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                                placeholder="Special requests..."
                                                value={createForm.notes}
                                                onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-card border rounded-2xl p-5 space-y-3">
                                        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Order Summary</h2>
                                        {createItems.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No items added yet</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {createItems.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">{item.name} ×{item.qty}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                                                            <button onClick={() => removeItem(item.id)} className="text-destructive hover:text-red-700 text-xs">✕</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-2 flex justify-between font-black">
                                                    <span>Subtotal</span>
                                                    <span className="text-primary">Rp {subtotal.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            className="w-full font-black rounded-xl"
                                            disabled={createLoading || createItems.length === 0}
                                            onClick={handleCreateInvoice}
                                        >
                                            {createLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : '🧾 Create Invoice'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Right: Product Picker */}
                                <div className="bg-card border rounded-2xl p-5 space-y-3">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">Select Products</h2>
                                    {availableProducts.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading products...</div>
                                    ) : (
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                            {availableProducts.map((p: any) => (
                                                <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all">
                                                    <div>
                                                        <p className="text-sm font-bold">{p.name}</p>
                                                        <p className="text-xs text-muted-foreground">{p.category} • Rp {Number(p.monthlyPrice || p.price || 0).toLocaleString('id-ID')}/mo</p>
                                                        {p.stock !== undefined && <p className={`text-[10px] font-bold mt-0.5 ${p.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>{p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} available`}</p>}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={createItems.find(i => i.id === p.id) ? 'default' : 'outline'}
                                                        className="shrink-0 text-xs font-black"
                                                        onClick={() => addItem(p)}
                                                        disabled={p.stock === 0}
                                                    >
                                                        {createItems.find(i => i.id === p.id) ? `+1 (${createItems.find(i => i.id === p.id)?.qty})` : '+ Add'}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })()}

                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
