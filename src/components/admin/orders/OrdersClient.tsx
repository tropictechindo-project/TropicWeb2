"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRealtimePoller } from "@/hooks/useRealtimePoller"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, CheckCircle2, CreditCard, Filter, Package, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"


interface Order {
    id: string
    user: string
    email: string
    period: string
    startDate?: string
    endDate?: string
    paymentMethod?: string
    deliveryAddress?: string
    subtotal?: number
    tax?: number
    deliveryFee?: number
    status: string
    paymentStatus?: string
    itemCount: number
    totalAmount: number
    orderNumber: string
    createdAt: string
    whatsapp: string
    invoiceId?: string
    isClaimed?: boolean

    items: {
        id: string
        name: string
        type: string
        quantity: number
        price: number
        serialNumber?: string
    }[]
}

function AssetAssignDropdown({ itemId, productId }: { itemId: string, productId?: string }) {
    const [units, setUnits] = useState<any[]>([])
    const [selectedUnit, setSelectedUnit] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [assigned, setAssigned] = useState(false)

    const fetchUnits = async () => {
        const url = productId 
            ? `/api/admin/inventory-units?productId=${productId}&status=available`
            : `/api/admin/inventory-units?status=available`
        const res = await fetch(url)
        if (res.ok) setUnits(await res.json())
    }

    const handleAssign = async () => {
        if (!selectedUnit) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/order-items/${itemId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitId: selectedUnit })
            })
            if (res.ok) {
                toast.success("Asset assigned successfully")
                setAssigned(true)
                fetchUnits() // Refresh available
            } else {
                toast.error("Failed to assign")
            }
        } catch {
            toast.error("Error connecting")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            {!assigned && <span className="text-[8px] text-red-500 font-black uppercase tracking-wider">Not linked to asset</span>}
            <div className="flex items-center gap-1">
                {assigned ? (
                    <Badge variant="outline" className="text-[8px] bg-green-50 text-green-700 border-green-200">Linked</Badge>
                ) : units.length === 0 ? (
                    <p className="text-[8px] text-muted-foreground italic h-6 flex items-center" onMouseEnter={fetchUnits}>Load Assets</p>
                ) : (
                    <>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                            <SelectTrigger className="h-6 text-[9px] w-[110px] bg-background border-dashed">
                                <SelectValue placeholder="Assign Asset" />
                            </SelectTrigger>
                            <SelectContent className="text-[10px]">
                                {units.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id} className="text-[10px]">{u.serialCode}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            size="sm" 
                            variant="secondary"
                            className="h-6 text-[8px] px-1 font-black uppercase hover:bg-primary hover:text-white" 
                            onClick={handleAssign} 
                            disabled={loading || !selectedUnit}
                        >
                            {loading ? "..." : "Link"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

interface OrdersClientProps {
    initialOrders: Order[]
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>(initialOrders)

    // Real-time synchronization
    useEffect(() => {
        if (initialOrders.length > orders.length && orders.length > 0) {
            toast.info("🔔 New incoming order received!")
        }
        setOrders(initialOrders)
    }, [initialOrders])

    useRealtimePoller(() => {
        router.refresh()
    }, 15000)
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

    const filteredOrders = orders.filter(order => {
        if (filterStatus === "ALL") return true
        if (filterStatus === "NEW") {
            return (order.status === 'AWAITING_PAYMENT' || order.status === 'PENDING') && !order.isClaimed
        }
        if (filterStatus === "ACTIVE") {
            return order.status === 'ACTIVE' || order.status === 'DELIVERED' || order.status === 'CONFIRMED'
        }
        if (filterStatus === "PICKUP") {
            if (!order.endDate) return false
            const daysLeft = (new Date(order.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            return (order.status === 'ACTIVE' || order.status === 'DELIVERED' || order.status === 'CONFIRMED') && daysLeft <= 3 && daysLeft >= 0
        }

        if (filterStatus === "NON_ACTIVE") {
            return order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'PICKED_UP'
        }
        return false
    })


    return (
        <div className="space-y-4">
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
                <TabsList className="bg-muted/50 p-1 mb-2 flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="ALL" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-background">All Orders</TabsTrigger>
                    <TabsTrigger value="NEW" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-background flex items-center gap-1">New Orders {orders.filter(o => (o.status === 'AWAITING_PAYMENT' || o.status === 'PENDING') && !o.isClaimed).length > 0 && <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px]">{orders.filter(o => (o.status === 'AWAITING_PAYMENT' || o.status === 'PENDING') && !o.isClaimed).length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="ACTIVE" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-background">Active Rentals</TabsTrigger>
                    <TabsTrigger value="PICKUP" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-background flex items-center gap-1">Pick Up <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-500/10 text-amber-600 border-amber-500/20">Soon</Badge></TabsTrigger>
                    <TabsTrigger value="NON_ACTIVE" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-background">Non-Active</TabsTrigger>
                </TabsList>
            </Tabs>


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
                                            {order.invoiceId && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500" onClick={() => window.open(`/invoice/${order.invoiceId}`, '_blank')}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            )}
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
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "CONFIRM & SEND INVOICE"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Order Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-4xl bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Order <span className="text-primary text-3xl">Details</span></DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium font-mono text-[10px]">
                            {selectedOrder?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Info</p>
                                        <p className="font-bold text-lg">{selectedOrder.user}</p>
                                        <p className="text-xs text-muted-foreground">{selectedOrder.email}</p>
                                        <p className="text-xs text-muted-foreground">{selectedOrder.whatsapp}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rental Period</p>
                                        <p className="font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
                                            {selectedOrder.period}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Status</p>
                                    <Badge variant={getStatusColor(selectedOrder.status) as any} className="font-black text-xs uppercase px-4 py-1">
                                        {selectedOrder.status}
                                    </Badge>
                                    <p className="text-[10px] text-muted-foreground mt-2">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Order Items</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    <Package className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{item.name}</p>
                                                    <div className="flex gap-2 items-center">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">{item.type}</p>
                                                        {item.serialNumber && (
                                                            <Badge variant="secondary" className="text-[9px] h-4 font-mono px-1">SN: {item.serialNumber}</Badge>
                                                        )}
                                                    </div>
                                                    {item.type === 'Snapshot' && (
                                                        <div className="mt-1">
                                                            <AssetAssignDropdown itemId={item.id} productId={item.productId} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">Qty: {item.quantity}</p>
                                                <p className="text-[10px] text-muted-foreground">Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Method</p>
                                    <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 bg-background">{selectedOrder.paymentMethod || "MANUAL"}</Badge>
                                    
                                    {selectedOrder.deliveryAddress && (
                                        <div className="mt-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delivery Address</p>
                                            <p className="font-medium text-[11px] text-muted-foreground line-clamp-2">{selectedOrder.deliveryAddress}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-bold">Rp {(selectedOrder as any).subtotal?.toLocaleString('id-ID') || "0"}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">Delivery:</span>
                                        <span className="font-bold">Rp {(selectedOrder as any).deliveryFee?.toLocaleString('id-ID') || "0"}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">Tax (2%):</span>
                                        <span className="font-bold">Rp {(selectedOrder as any).tax?.toLocaleString('id-ID') || "0"}</span>
                                    </div>
                                </div>
                            </div>


                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total Price</p>
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
