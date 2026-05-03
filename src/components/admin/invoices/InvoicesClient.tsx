'use client'

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Download,
    Plus,
    Search,
    User,
    UserPlus,
    FileText,
    Link as LinkIcon,
    Loader2,
    Edit,
    Mail,
    Trash2,
    Truck,
    Eye,
    ClipboardCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { generateInvoicePDF } from "@/lib/pdf/invoice"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface InvoiceItem {
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

interface Invoice {
    id: string
    invoiceNumber: string
    date: string
    customerName: string
    customerEmail: string
    customerWhatsApp?: string
    total: number
    status: string
    orderNumber: string
    startDate: string
    endDate: string
    currency?: string
    deliveryAddress?: string
    paymentMethod?: string
    items: InvoiceItem[]

    userId?: string
    guestName?: string
    guestEmail?: string
    guestWhatsapp?: string
    subtotal: number
    tax: number
    deliveryFee: number
}

interface InvoicesClientProps {
    initialInvoices: Invoice[]
    users: any[]
    products?: any[]
}

export function InvoicesClient({ initialInvoices, users, products }: InvoicesClientProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [invoiceType, setInvoiceType] = useState<"registered" | "guest">("registered")

    // Form State
    const [formData, setFormData] = useState({
        userId: "",
        guestName: "",
        guestEmail: "",
        guestWhatsapp: "",
        guestAddress: "",
        amount: "",
        subtotal: "",
        tax: "0",
        deliveryFee: "100000",
        discountAmount: "0",
        discountPercentage: "0",
        items: "Standard Rental Package",
        status: "PAID",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sendToCustomer: true,
        sendToWorkers: false,
        sendToCompany: true,
        activateOrderFlow: true,
        sendSpiNotifications: true,
        paymentMethod: "CASH"
    })

    const [itemsList, setItemsList] = useState<Array<{ id: string, name: string, price: number, quantity: number }>>([
        { id: '', name: '', price: 0, quantity: 1 }
    ])

    const calculateTotalsFromItems = (list: typeof itemsList, dFeeStr = formData.deliveryFee, discAmtStr = formData.discountAmount, pMethod = formData.paymentMethod) => {
        const sub = list.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        const dFee = parseFloat(dFeeStr || "0")
        const disc = parseFloat(discAmtStr || "0")
        
        // Dynamic Surcharge Calculation
        let surcharge = 0
        if (pMethod === 'BANK_TRANSFER') surcharge = Math.round((sub - disc) * 0.025)
        else if (pMethod === 'EDC') surcharge = Math.round((sub - disc) * 0.025)
        else if (pMethod === 'PAYPAL') surcharge = Math.round((sub - disc) * 0.05)
        else if (pMethod === 'WISE') surcharge = 85000
        else if (pMethod === 'STRIPE' || pMethod === 'VISA_MASTERCARD') surcharge = Math.round((sub - disc) * 0.035)
        else if (pMethod === 'CRYPTO') surcharge = Math.round((sub - disc) * 0.01)

        const taxVal = Math.max(0, (sub - disc)) * 0.02
        const tot = Math.max(0, sub - disc + taxVal + dFee + surcharge)
        setFormData(prev => ({
            ...prev,
            subtotal: sub.toString(),
            tax: taxVal.toString(),
            amount: tot.toString()
        }))
    }

    const formatNumber = (val: string | number) => {
        if (!val) return ""
        const num = val.toString().replace(/[^0-9.]/g, "")
        if (!num) return ""
        return new Intl.NumberFormat('en-US').format(parseFloat(num))
    }

    const parseNumber = (val: string) => {
        return val.replace(/,/g, "")
    }

    const filteredInvoices = initialInvoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const { user } = useAuth()

    const AdminGuide = () => (
        <Card className="mb-6 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <FileText className="w-4 h-4" /> ADMIN COMMAND: INVOICE CONTROL (AU)
                </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-amber-800 dark:text-amber-300 font-medium">
                <p>G'day! Here's the drill for managing the bills, mate:</p>
                <p>• <b>Manual Invoices:</b> Hit "Create Invoice" to whip up a new bill. You can even trigger the delivery flow from here.</p>
                <p>• <b>PDF Generation:</b> Grab the invoice by clicking the download icon. Perfect for printing or sending a copy, cheers.</p>
                <p>• <b>Order Sync:</b> If "Activate Order Flow" is on, it'll automatically set up a delivery job for the boys in the field.</p>
            </CardContent>
        </Card>
    )

    const OperatorGuide = () => (
        <Card className="mb-6 border-l-4 border-l-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <ClipboardCheck className="w-4 h-4" /> PANDUAN OPERATOR: KONTROL INVOICE
                </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                <p>Halo Operator! Gunakan panel ini untuk mengelola pembayaran:</p>
                <p>• <b>Buat Invoice:</b> Klik "Create Invoice" untuk pelanggan baru. Masukkan detail barang dan pilih metode bayar.</p>
                <p>• <b>Alur Pengiriman:</b> Aktifkan "Activate Order Flow" agar tim gudang/worker langsung menerima notifikasi tugas.</p>
                <p>• <b>Pantau Status:</b> Pastikan status "PAID" sudah benar sebelum barang dikeluarkan dari gudang.</p>
            </CardContent>
        </Card>
    )

    const handleDownload = async (invoice: Invoice) => {
        try {
            const pdf = await generateInvoicePDF({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: new Date(invoice.date).toLocaleDateString(),
                customerName: invoice.customerName,
                customerEmail: invoice.customerEmail,
                customerWhatsApp: invoice.customerWhatsApp,
                orderNumber: invoice.orderNumber?.substring(0, 8) || "MANUAL",
                startDate: new Date(invoice.startDate).toLocaleDateString(),
                endDate: new Date(invoice.endDate).toLocaleDateString(),
                currency: 'Rp',
                subtotal: Number(invoice.subtotal || invoice.total),
                tax: Number(invoice.tax || 0),
                deliveryFee: Number(invoice.deliveryFee || 0),
                discountAmount: Number((invoice as any).discountAmount || 0),
                total: Number(invoice.total),
                items: invoice.items,
                isRegistered: !!invoice.userId
            } as any)
            pdf.save(`${invoice.invoiceNumber}.pdf`)
            toast.success("Invoice downloaded")
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate PDF")
        }
    }

    const handleShare = (invoice: Invoice) => {
        const link = `${window.location.origin}/invoice/${invoice.id}`
        navigator.clipboard.writeText(link)
        toast.success("Public invoice link copied")
    }

    const handleEdit = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setFormData({
            userId: invoice.userId || "",
            guestName: invoice.guestName || "",
            guestEmail: invoice.customerEmail || "",
            guestWhatsapp: invoice.customerWhatsApp || "",
            guestAddress: (invoice as any).guestAddress || "",
            amount: invoice.total.toString(),
            subtotal: (invoice as any).subtotal?.toString() || invoice.total.toString(),
            tax: (invoice as any).tax?.toString() || "0",
            deliveryFee: (invoice as any).deliveryFee?.toString() || "100000",
            discountAmount: (invoice as any).discountAmount?.toString() || "0",
            discountPercentage: (invoice as any).discountPercentage?.toString() || "0",
            items: invoice.items[0]?.name || "Standard Rental Package",
            status: invoice.status,
            startDate: new Date(invoice.startDate).toISOString().split('T')[0],
            endDate: new Date(invoice.endDate).toISOString().split('T')[0],
            sendToCustomer: false,
            sendToWorkers: false,
            sendToCompany: false,
            activateOrderFlow: true,
            sendSpiNotifications: true,
            paymentMethod: invoice.paymentMethod || "CASH"
        })

        // Prefill items with itemsList from invoice.items
        if (invoice.items && invoice.items.length > 0) {
            setItemsList(invoice.items.map(item => {
                // Try to find the matching product ID from our product list by name
                const matchedProduct = products?.find(p => p.name === item.name)
                return {
                    id: matchedProduct?.id || '',
                    name: item.name,
                    price: Number(item.unitPrice),
                    quantity: item.quantity
                }
            }))
        } else {
            setItemsList([{ id: '', name: 'Manual Service / Rental', price: invoice.total, quantity: 1 }])
        }

        setIsEditOpen(true)
    }


    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/invoices/${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!res.ok) throw new Error("Failed")
            toast.success("Invoice deleted")
            router.refresh()
        } catch {
            toast.error("Failed to delete")
        }
    }

    const handleSetDelivery = async (invoiceId: string) => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/deliveries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    invoiceId,
                    deliveryMethod: 'INTERNAL'
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create delivery')
            }

            toast.success("Delivery pushed to Queue successfully!")
            router.push('/admin/deliveries')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: invoiceType,
                    ...formData,
                    amount: parseFloat(formData.amount),
                    subtotal: parseFloat(formData.subtotal || formData.amount),
                    tax: parseFloat(formData.tax),
                    deliveryFee: parseFloat(formData.deliveryFee),
                    discountAmount: parseFloat(formData.discountAmount),
                    discountPercentage: parseInt(formData.discountPercentage),
                    items: itemsList // Pass dynamic items list
                })
            })

            if (!res.ok) throw new Error("Failed to create")

            toast.success("Manual invoice created")
            setIsCreateOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to create invoice")
        } finally {
            setIsLoading(false)
        }
    }

    const onEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedInvoice) return
        setIsLoading(true)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/invoices/${selectedInvoice.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: formData.status,
                    total: parseFloat(formData.amount),
                    subtotal: parseFloat(formData.subtotal || formData.amount),
                    tax: parseFloat(formData.tax),
                    deliveryFee: parseFloat(formData.deliveryFee),
                    discountAmount: parseFloat(formData.discountAmount),
                    discountPercentage: parseInt(formData.discountPercentage),
                    guestName: formData.guestName,
                    guestEmail: formData.guestEmail,
                    guestWhatsapp: formData.guestWhatsapp,
                    address: formData.guestAddress,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString(),
                    items: itemsList // Pass dynamic items list
                })
            })


            if (!res.ok) throw new Error("Failed")
            toast.success("Invoice updated")
            setIsEditOpen(false)
            router.refresh()
        } catch {
            toast.error("Failed to update invoice")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {user?.role === 'ADMIN' ? <AdminGuide /> : <OperatorGuide />}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search invoices..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="font-bold gap-2">
                    <Plus className="h-4 w-4" /> CREATE MANUAL INVOICE
                </Button>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden text-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-mono font-bold text-primary">{inv.invoiceNumber}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold flex items-center gap-1.5">
                                            {inv.userId ? <User className="h-3 w-3 text-blue-500" /> : <UserPlus className="h-3 w-3 text-orange-500" />}
                                            {inv.customerName}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{inv.customerEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={inv.status === 'PAID' ? 'default' : 'outline'} className="text-[10px] font-bold">
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-black">Rp {inv.total.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs font-bold gap-1 mr-2 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                                            onClick={() => handleSetDelivery(inv.id)}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Truck className="h-3 w-3" />
                                            )}
                                            {isLoading ? "Wait..." : "SET DELIVERY"}
                                        </Button>
                                         <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             className="h-8 w-8 text-emerald-500" 
                                             onClick={() => {
                                                 setSelectedInvoice(inv)
                                                 setIsPreviewOpen(true)
                                             }}
                                         >
                                             <Eye className="h-4 w-4" />
                                         </Button>

                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleShare(inv)}>
                                             <LinkIcon className="h-4 w-4" />
                                         </Button>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(inv)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(inv)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Manual Invoice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                            <Button
                                type="button"
                                variant={invoiceType === 'registered' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setInvoiceType('registered')}
                                className="text-xs font-bold"
                            >Registered User</Button>
                            <Button
                                type="button"
                                variant={invoiceType === 'guest' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setInvoiceType('guest')}
                                className="text-xs font-bold"
                            >Guest / New</Button>
                        </div>

                        {invoiceType === 'registered' ? (
                            <div className="space-y-2">
                                <Label>Select Registered User</Label>
                                <Select value={formData.userId} onValueChange={(v) => setFormData({ ...formData, userId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chose user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={u.id}>{u.fullName || u.username} ({u.email})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label>Full Name</Label>
                                    <Input placeholder="Guest Name" value={formData.guestName} onChange={e => setFormData({ ...formData, guestName: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="Email Address" value={formData.guestEmail} onChange={e => setFormData({ ...formData, guestEmail: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>WhatsApp</Label>
                                    <Input placeholder="+62..." value={formData.guestWhatsapp} onChange={e => setFormData({ ...formData, guestWhatsapp: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Address</Label>
                                    <Input placeholder="Guest Address" value={formData.guestAddress} onChange={e => setFormData({ ...formData, guestAddress: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Start Date</Label>
                                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Date</Label>
                                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between items-center text-xs">
                                <span>Rental Items/Equipment</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    const newList = [...itemsList, { id: '', name: '', price: 0, quantity: 1 }]
                                    setItemsList(newList)
                                    calculateTotalsFromItems(newList)
                                }} className="h-6 text-[10px] font-bold gap-1"><Plus className="h-3 w-3"/> ADD</Button>
                            </Label>
                            <div className="space-y-2 max-h-44 overflow-y-auto border rounded-xl p-2 bg-muted/10">
                                {itemsList.map((item, idx) => (
                                    <div key={idx} className="flex gap-1.5 items-center">
                                        <div className="flex-1">
                                            <Select value={item.id} onValueChange={(val) => {
                                                const prod = products?.find(p => p.id === val)
                                                if (prod) {
                                                    const newList = [...itemsList]
                                                    newList[idx] = { id: val, name: prod.name, price: Number(prod.monthlyPrice), quantity: item.quantity }
                                                    setItemsList(newList)
                                                    calculateTotalsFromItems(newList)
                                                }
                                            }}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder={item.name || "Select Product"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input type="text" className="h-8 text-xs px-1" value={formatNumber(item.price)} onChange={e => {
                                                const newList = [...itemsList]
                                                newList[idx].price = parseFloat(parseNumber(e.target.value)) || 0
                                                setItemsList(newList)
                                                calculateTotalsFromItems(newList)
                                            }} placeholder="Price"/>
                                        </div>
                                        <div className="w-14">
                                            <Input type="number" className="h-8 text-xs px-1 text-center" value={item.quantity} onChange={e => {
                                                const newList = [...itemsList]
                                                newList[idx].quantity = parseInt(e.target.value) || 1
                                                setItemsList(newList)
                                                calculateTotalsFromItems(newList)
                                            }}/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                            const newList = itemsList.filter((_, i) => i !== idx)
                                            setItemsList(newList)
                                            calculateTotalsFromItems(newList)
                                        }}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Subtotal (IDR)</Label>
                                <Input type="text" value={formatNumber(formData.subtotal || formData.amount)} onChange={e => setFormData({ ...formData, subtotal: parseNumber(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax (IDR)</Label>
                                <Input type="text" value={formatNumber(formData.tax)} onChange={e => setFormData({ ...formData, tax: parseNumber(e.target.value) })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-primary font-bold">Discount Amount (IDR)</Label>
                                <Input type="text" value={formatNumber(formData.discountAmount)} onChange={e => {
                                    const val = parseNumber(e.target.value)
                                    setFormData({ ...formData, discountAmount: val })
                                    calculateTotalsFromItems(itemsList, formData.deliveryFee, val)
                                }} className="border-primary/20 bg-primary/5 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={v => {
                                    setFormData({ ...formData, paymentMethod: v })
                                    calculateTotalsFromItems(itemsList, formData.deliveryFee, formData.discountAmount, v)
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                        <SelectItem value="WISE">Wise</SelectItem>
                                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                                        <SelectItem value="EDC">EDC Machine</SelectItem>
                                        <SelectItem value="STRIPE">Stripe/Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Delivery Fee (IDR)</Label>
                                <Input type="text" value={formatNumber(formData.deliveryFee)} onChange={e => {
                                    const val = parseNumber(e.target.value)
                                    setFormData({ ...formData, deliveryFee: val })
                                    calculateTotalsFromItems(itemsList, val)
                                }} />
                            </div>
                            <div className="space-y-2">
                                <Label>Total Amount (IDR)</Label>
                                <Input type="text" value={formatNumber(formData.amount)} onChange={e => setFormData({ ...formData, amount: parseNumber(e.target.value) })} required className="font-black text-primary" />
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20 border-dashed">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Truck className="h-3 w-3" /> WORKFLOW AUTOMATION
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="order_flow" checked={formData.activateOrderFlow} onCheckedChange={(v) => setFormData({ ...formData, activateOrderFlow: !!v })} />
                                    <label htmlFor="order_flow" className="text-xs font-bold cursor-pointer text-primary">Activate Delivery & Pickup Flow</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="spi_notif" checked={formData.sendSpiNotifications} onCheckedChange={(v) => setFormData({ ...formData, sendSpiNotifications: !!v })} />
                                    <label htmlFor="spi_notif" className="text-xs font-bold cursor-pointer text-primary">Trigger SPI Real-time Notifications</label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-dashed">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3 w-3" /> EMAIL AUTOMATION
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="cust" checked={formData.sendToCustomer} onCheckedChange={(v) => setFormData({ ...formData, sendToCustomer: !!v })} />
                                    <label htmlFor="cust" className="text-xs font-bold cursor-pointer">Forward to Customer (New/Registered)</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="workers" checked={formData.sendToWorkers} onCheckedChange={(v) => setFormData({ ...formData, sendToWorkers: !!v })} />
                                    <label htmlFor="workers" className="text-xs font-bold cursor-pointer">Forward to Workers Email</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="comp" checked={formData.sendToCompany} onCheckedChange={(v) => setFormData({ ...formData, sendToCompany: !!v })} />
                                    <label htmlFor="comp" className="text-xs font-bold cursor-pointer">Forward to Company (contact@tropictech.online)</label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="w-full font-bold uppercase shadow-lg shadow-primary/20" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                GENERATE & SEND INVOICE
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Invoice Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={onEditSubmit} className="space-y-4 py-4">
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label>Customer Name</Label>
                                <Input value={formData.guestName} onChange={e => setFormData({ ...formData, guestName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Email</Label>
                                <Input value={formData.guestEmail} onChange={e => setFormData({ ...formData, guestEmail: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Address</Label>

                                <Input value={formData.guestAddress} onChange={e => setFormData({ ...formData, guestAddress: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">End Date</Label>
                                    <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between items-center text-xs">
                                <span>Rental Items/Equipment</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    const newList = [...itemsList, { id: '', name: '', price: 0, quantity: 1 }]
                                    setItemsList(newList)
                                    calculateTotalsFromItems(newList)
                                }} className="h-6 text-[10px] font-bold gap-1"><Plus className="h-3 w-3"/> ADD</Button>
                            </Label>
                            <div className="space-y-2 max-h-44 overflow-y-auto border rounded-xl p-2 bg-muted/10">
                                {itemsList.map((item, idx) => (
                                    <div key={idx} className="flex gap-1.5 items-center">
                                        <div className="flex-1">
                                            <Select value={item.id} onValueChange={(val) => {
                                                const prod = products?.find(p => p.id === val)
                                                if (prod) {
                                                    const newList = [...itemsList]
                                                    newList[idx] = { id: val, name: prod.name, price: Number(prod.monthlyPrice), quantity: item.quantity }
                                                    setItemsList(newList)
                                                    calculateTotalsFromItems(newList)
                                                }
                                            }}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder={item.name || "Select Product"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24">
                                            <Input type="text" className="h-8 text-xs px-1" value={formatNumber(item.price)} onChange={e => {
                                                const newList = [...itemsList]
                                                newList[idx].price = parseFloat(parseNumber(e.target.value)) || 0
                                                setItemsList(newList)
                                                calculateTotalsFromItems(newList)
                                            }} placeholder="Price"/>
                                        </div>
                                        <div className="w-14">
                                            <Input type="number" className="h-8 text-xs px-1 text-center" value={item.quantity} onChange={e => {
                                                const newList = [...itemsList]
                                                newList[idx].quantity = parseInt(e.target.value) || 1
                                                setItemsList(newList)
                                                calculateTotalsFromItems(newList)
                                            }}/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                                            const newList = itemsList.filter((_, i) => i !== idx)
                                            setItemsList(newList)
                                            calculateTotalsFromItems(newList)
                                        }}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>



                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PAID">PAID</SelectItem>
                                        <SelectItem value="PENDING">PENDING</SelectItem>
                                        <SelectItem value="SENT">SENT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Subtotal</Label>
                                <Input type="text" value={formatNumber(formData.subtotal || formData.amount)} onChange={e => setFormData({ ...formData, subtotal: parseNumber(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-primary font-bold">Discount Amount</Label>
                                <Input type="text" value={formatNumber(formData.discountAmount)} onChange={e => {
                                    const val = parseNumber(e.target.value)
                                    setFormData({ ...formData, discountAmount: val })
                                    calculateTotalsFromItems(itemsList, formData.deliveryFee, val)
                                }} className="border-primary/20 bg-primary/5 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.paymentMethod} onValueChange={v => {
                                    setFormData({ ...formData, paymentMethod: v })
                                    calculateTotalsFromItems(itemsList, formData.deliveryFee, formData.discountAmount, v)
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                        <SelectItem value="WISE">Wise</SelectItem>
                                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                                        <SelectItem value="EDC">EDC Machine</SelectItem>
                                        <SelectItem value="STRIPE">Stripe/Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <Input type="text" value={formatNumber(formData.amount)} onChange={e => setFormData({ ...formData, amount: parseNumber(e.target.value) })} className="font-black text-primary" />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" className="w-full font-bold uppercase" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                SAVE CHANGES
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center text-xl font-black uppercase tracking-tight">
                            <span>Invoice Preview</span>
                            {selectedInvoice && (
                                <Badge variant={selectedInvoice.status === 'PAID' ? 'default' : 'outline'} className="text-[10px] font-bold">
                                    {selectedInvoice.status}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="border-b pb-4">
                                <p className="text-sm font-black text-primary">{selectedInvoice.invoiceNumber}</p>
                                <p className="text-xs text-muted-foreground">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer</p>
                                    <p className="text-sm font-bold">{selectedInvoice.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{selectedInvoice.customerEmail}</p>
                                    {selectedInvoice.customerWhatsApp && <p className="text-xs text-muted-foreground">WA: {selectedInvoice.customerWhatsApp}</p>}
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rental Period</p>
                                    <p className="text-xs font-bold">{new Date(selectedInvoice.startDate).toLocaleDateString()} - {new Date(selectedInvoice.endDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {selectedInvoice.deliveryAddress && (
                                <div className="space-y-2 border-t pt-3 mt-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery Address</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{selectedInvoice.deliveryAddress}</p>
                                </div>
                            )}

                            {selectedInvoice.paymentMethod && (
                                <div className="space-y-1 border-t pt-3 mt-1 flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Method</p>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">{selectedInvoice.paymentMethod}</Badge>
                                </div>
                            )}


                            <div className="border-t pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Line Items</p>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(selectedInvoice.items && selectedInvoice.items.length > 0) ? (
                                        selectedInvoice.items.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center bg-muted/30 p-2 rounded-lg text-sm border">
                                                <div>
                                                    <p className="font-bold text-xs">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-black text-xs">Rp {(Number(item.unitPrice) * item.quantity).toLocaleString('id-ID')}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 bg-muted/20 rounded-lg text-center text-xs text-muted-foreground">
                                            No explicit items listed (Manual Package/Service)
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-1 text-xs">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-bold">Rp {Number(selectedInvoice.subtotal || selectedInvoice.total).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground">Delivery Fee:</span>
                                    <span className="font-bold">Rp {Number(selectedInvoice.deliveryFee || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-muted-foreground">Tax (2%):</span>
                                    <span className="font-bold">Rp {Number(selectedInvoice.tax || 0).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed pt-2 font-black text-lg text-primary mt-1">
                                    <span>Total Amount:</span>
                                    <span className="text-xl">Rp {Number(selectedInvoice.total).toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full sm:w-auto font-bold flex items-center gap-1.5 h-9 text-xs" 
                                    onClick={() => handleDownload(selectedInvoice)}
                                >

                                    <Download className="h-3.5 w-3.5" /> Download PDF
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="default" 
                                    className="w-full sm:w-auto font-bold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 h-9 text-xs" 
                                    onClick={() => {
                                        const link = `${window.location.origin}/invoice/${selectedInvoice.id}`
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `Invoice ${selectedInvoice.invoiceNumber}`,
                                                text: 'Check out this invoice from Tropic Tech!',
                                                url: link
                                            }).catch(() => {})
                                        } else {
                                            navigator.clipboard.writeText(link)
                                            toast.success("Link copied to clipboard!")
                                        }
                                        window.open(`https://wa.me/?text=${encodeURIComponent("Check your invoice details node flawless safely outwards forwards: " + link)}`, '_blank')
                                    }}
                                >
                                    <LinkIcon className="h-3.5 w-3.5" /> Share
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>

    )
}
