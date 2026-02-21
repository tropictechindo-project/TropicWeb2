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
import { Eye, CheckCircle2, CreditCard, Filter } from "lucide-react"
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
}

interface OrdersClientProps {
    initialOrders: Order[]
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [filterStatus, setFilterStatus] = useState<string>("ALL")
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("CASH")
    const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<number | "">("")
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
                    deliveryFeeOverride: deliveryFeeOverride === "" ? undefined : deliveryFeeOverride
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
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
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
                                    <SelectItem value="CASH">Cash on Delivery</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer (BCA)</SelectItem>
                                    <SelectItem value="CRYPTO">USDT / Crypto</SelectItem>
                                    <SelectItem value="WISE">Wise Transfer</SelectItem>
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

                        {selectedOrder && (
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary rounded-lg">
                                        <CreditCard className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase text-zinc-500">Order Subtotal</p>
                                        <p className="text-lg font-black tracking-tight text-white">
                                            Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-zinc-500">Tax</p>
                                    <p className="text-lg font-black tracking-tight text-primary">2.0%</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                            className="rounded-xl font-bold border-zinc-800 hover:bg-zinc-900"
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
        </div>
    )
}
