"use client"

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
import { Eye, CheckCircle2, CreditCard, Filter, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Order {
    id: string
    user: string
    email: string
    period: string
    status: string
    paymentStatus?: string
    itemCount: number
    totalAmount: number
    orderNumber: string // Missing in previous interface
    createdAt: string
    whatsapp: string
    items: {
        id: string
        name: string
        type: string
        quantity: number
        price: number
        serialNumber?: string
    }[]
}

interface OrdersClientProps {
    initialOrders: Order[]
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("CASH")
    const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<number | "">("")
    const [discountPercentage, setDiscountPercentage] = useState<number | "">("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default'
            case 'COMPLETED': return 'secondary'
            case 'CANCELLED': return 'destructive'
            case 'PENDING': return 'outline'
            case 'CONFIRMED': return 'default'
            default: return 'outline'
        }
    }

    const handleConfirmPayment = async () => {
        if (!selectedOrder) return

        setIsSubmitting(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/admin/orders/${selectedOrder.id}/confirm-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentMethod,
                    deliveryFeeOverride: deliveryFeeOverride === "" ? undefined : deliveryFeeOverride,
                    discountPercentage: discountPercentage === "" ? undefined : discountPercentage
                })
            })

            if (response.ok) {
                toast.success("Payment confirmed and invoice sent!")
                setConfirmDialogOpen(false)
                // Refresh local state or trigger a reload
                setOrders(prev => prev.map(o =>
                    o.id === selectedOrder.id ? { ...o, status: 'CONFIRMED', paymentStatus: 'PAID' } : o
                ))
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to confirm payment")
            }
        } catch (error) {
            toast.error("An error occurred during payment confirmation")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredOrders = filterStatus === "ALL"
        ? orders
        : orders.filter(o => o.status === filterStatus)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Orders</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-bold">Order ID</TableHead>
                            <TableHead className="font-bold">User</TableHead>
                            <TableHead className="font-bold">Rental Period</TableHead>
                            <TableHead className="font-bold">Items</TableHead>
                            <TableHead className="font-bold">Total</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="text-right font-bold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-mono text-xs text-primary font-bold">
                                        {order.id.substring(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold tracking-tight">{order.user}</span>
                                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">{order.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{order.period}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-bold">{order.itemCount} items</Badge>
                                    </TableCell>
                                    <TableCell className="font-black text-primary">
                                        Rp {order.totalAmount.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(order.status) as any} className="font-bold text-[10px] uppercase px-3 py-1">
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {order.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 gap-2 font-bold text-[10px] uppercase shadow-sm"
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setConfirmDialogOpen(true)
                                                    }}
                                                >
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Confirm Pay
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => {
                                                setSelectedOrder(order)
                                                setDetailsDialogOpen(true)
                                            }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirm Payment Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Confirm <span className="text-primary text-3xl">Payment</span></DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium">
                            Once confirmed, an invoice with 2% tax will be generated and emailed to the customer and workers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 rounded-xl h-12 font-bold">
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="STRIPE">Stripe</SelectItem>
                                    <SelectItem value="WISE">Wise Transfer</SelectItem>
                                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                                    <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                                    <SelectItem value="CARD">Credit / Debit Card</SelectItem>
                                    <SelectItem value="CRYPTO">USDT / Crypto</SelectItem>
                                    <SelectItem value="EDC">EDC Machine</SelectItem>
                                    <SelectItem value="QRIS">QRIS</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer (BCA)</SelectItem>
                                    <SelectItem value="CASH">Cash on Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Delivery Fee Override (Optional)</Label>
                            <Input
                                type="number"
                                placeholder="Enter amount if different from default"
                                className="bg-zinc-900 border-zinc-800 rounded-xl h-12 font-bold"
                                value={deliveryFeeOverride}
                                onChange={(e) => setDeliveryFeeOverride(e.target.value === "" ? "" : Number(e.target.value))}
                            />
                            <p className="text-[10px] text-zinc-500 font-medium italic">Default is IDR 100,000</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Discount Percentage (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="e.g. 10 for 10%"
                                className="bg-zinc-900 border-zinc-800 rounded-xl h-12 font-bold focus:ring-primary"
                                value={discountPercentage}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === "") {
                                        setDiscountPercentage("")
                                        return
                                    }
                                    const numVal = Number(val)
                                    setDiscountPercentage(numVal > 100 ? 100 : numVal < 0 ? 0 : numVal)
                                }}
                            />
                        </div>

                        {selectedOrder && (() => {
                            const subtotal = selectedOrder.totalAmount
                            const discountVal = discountPercentage === "" ? 0 : discountPercentage
                            const discountAmount = subtotal * (discountVal / 100)
                            const subAfterDiscount = subtotal - discountAmount
                            const taxAmount = subAfterDiscount * 0.02
                            const finalDelivery = deliveryFeeOverride === "" ? 100000 : deliveryFeeOverride
                            const finalTotal = subAfterDiscount + taxAmount + finalDelivery

                            return (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary rounded-lg">
                                                <CreditCard className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase text-zinc-500">Order Subtotal</p>
                                                <p className="text-lg font-black tracking-tight text-white">
                                                    Rp {subtotal.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] font-black uppercase text-zinc-500">Discount ({discountVal}%)</p>
                                            <p className="text-sm font-bold tracking-tight text-red-400">
                                                -Rp {discountAmount.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-zinc-500">Tax & Delivery</p>
                                            <p className="text-xs font-bold text-zinc-400">
                                                +Rp {taxAmount.toLocaleString('id-ID')} (2% Tax)
                                                <br />
                                                +Rp {finalDelivery.toLocaleString('id-ID')} (Delivery)
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-zinc-500">Final Total</p>
                                            <p className="text-xl font-black tracking-tight text-primary">
                                                Rp {finalTotal.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                            className="rounded-xl font-bold border-zinc-800 hover:bg-zinc-900 bg-zinc-950 text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmPayment}
                            disabled={isSubmitting}
                            className="rounded-xl font-bold px-8 shadow-2xl bg-primary text-white"
                        >
                            {isSubmitting ? "Processing..." : "CONFIRM & SEND INVOICE"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Order Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Order <span className="text-primary text-3xl">Details</span></DialogTitle>
                        <DialogDescription className="text-zinc-400 font-medium font-mono text-[10px]">
                            {selectedOrder?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Customer Info</p>
                                        <p className="font-bold text-lg">{selectedOrder.user}</p>
                                        <p className="text-xs text-zinc-400">{selectedOrder.email}</p>
                                        <p className="text-xs text-zinc-400">{selectedOrder.whatsapp}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rental Period</p>
                                        <p className="font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
                                            {selectedOrder.period}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Order Status</p>
                                    <Badge variant={getStatusColor(selectedOrder.status) as any} className="font-black text-xs uppercase px-4 py-1">
                                        {selectedOrder.status}
                                    </Badge>
                                    <p className="text-[10px] text-zinc-500 mt-2">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-zinc-800 pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Order Items</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-800 rounded-lg">
                                                    <Package className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{item.name}</p>
                                                    <div className="flex gap-2 items-center">
                                                        <p className="text-[10px] text-zinc-500 uppercase font-black">{item.type}</p>
                                                        {item.serialNumber && (
                                                            <Badge variant="secondary" className="text-[9px] h-4 font-mono px-1">SN: {item.serialNumber}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">Qty: {item.quantity}</p>
                                                <p className="text-[10px] text-zinc-500">Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-500">Total Price</p>
                                    <p className="text-2xl font-black text-primary tracking-tighter">
                                        Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedOrder.status === 'PENDING' && (
                                        <Button
                                            size="sm"
                                            className="font-black text-[10px] uppercase h-10 px-6"
                                            onClick={() => {
                                                setDetailsDialogOpen(false)
                                                setConfirmDialogOpen(true)
                                            }}
                                        >
                                            Proceed to Payment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
