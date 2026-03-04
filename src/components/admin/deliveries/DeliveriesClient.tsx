"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Navigation,
    MoreHorizontal,
    Trash,
    Edit,
    Truck,
    MapPin,
    Package,
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    XCircle,
    PlayCircle,
    PauseCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

export function DeliveriesClient({
    initialDeliveries,
    workers = [],
    userRole = 'ADMIN'
}: {
    initialDeliveries: any[],
    workers?: any[],
    userRole?: 'ADMIN' | 'OPERATOR' | 'WORKER' | 'USER'
}) {
    const router = useRouter()
    const [deliveries, setDeliveries] = useState(initialDeliveries)
    const [isLoading, setIsLoading] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
    const [status, setStatus] = useState("")
    const [deliveryMethod, setDeliveryMethod] = useState("INTERNAL")
    const [workerId, setWorkerId] = useState<string | null>(null)
    const [eta, setEta] = useState<string>("")

    const dropoffs = deliveries.filter(d => d.deliveryType === 'DROPOFF')
    const pickups = deliveries.filter(d => d.deliveryType === 'PICKUP')

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDelivery) return

        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/deliveries/${selectedDelivery.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    deliveryMethod,
                    eta: eta ? new Date(eta).toISOString() : undefined,
                    claimedByWorkerId: workerId === "none" ? null : workerId
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update delivery')
            }

            toast.success("Delivery updated successfully")
            setIsEditOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this delivery?")) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/deliveries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to cancel delivery')
            }

            toast.success("Delivery canceled successfully")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'QUEUED': return <Badge variant="outline" className="bg-gray-50 text-gray-700"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>
            case 'CLAIMED': return <Badge variant="outline" className="bg-blue-50 text-blue-700"><User className="w-3 h-3 mr-1" /> Claimed</Badge>
            case 'OUT_FOR_DELIVERY': return <Badge variant="outline" className="bg-orange-50 text-orange-700"><MapPin className="w-3 h-3 mr-1" /> En Route</Badge>
            case 'PAUSED': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><PauseCircle className="w-3 h-3 mr-1" /> Paused</Badge>
            case 'DELAYED': return <Badge variant="outline" className="bg-red-50 text-red-700"><AlertCircle className="w-3 h-3 mr-1" /> Delayed</Badge>
            case 'COMPLETED': return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>
            case 'CANCELED': return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Canceled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const renderTable = (data: any[], emptyMessage: string) => (
        <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead>Delivery / Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Worker & Vehicle</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    {(userRole === 'ADMIN' || userRole === 'OPERATOR' || userRole === 'USER') && (
                        <TableHead className="text-right">Actions</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                ) : data.map((delivery) => (
                    <TableRow key={delivery.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-primary">#{delivery.invoice?.invoiceNumber || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground font-mono">ID: {delivery.id.split('-')[0]}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                                <span className="font-medium">{delivery.invoice?.order?.user?.fullName || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground">{delivery.invoice?.order?.user?.whatsapp || '-'}</span>
                                <div className="flex gap-2 mt-1">
                                    {(delivery.latitude && delivery.longitude) ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:bg-primary/5"
                                            onClick={() => window.open(`https://www.google.com/maps?q=${delivery.latitude},${delivery.longitude}`, '_blank')}
                                        >
                                            <MapPin className="w-3 h-3 text-primary" /> GPS PIN
                                        </Button>
                                    ) : delivery.invoice?.guestAddress?.includes('google.com/maps') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:bg-primary/5"
                                            onClick={() => window.open(delivery.invoice.guestAddress, '_blank')}
                                        >
                                            <Navigation className="w-3 h-3 text-primary" /> MAP LINK
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                                {delivery.claimedByWorker ? (
                                    <span className="font-medium flex items-center gap-1 text-blue-600">
                                        <User className="w-3 h-3" /> {delivery.claimedByWorker.fullName}
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">Unassigned</span>
                                )}
                                {delivery.vehicle ? (
                                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Truck className="w-3 h-3" /> {delivery.vehicle.name}
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No Vehicle</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary"><Package className="w-3 h-3 mr-1" /> {delivery.items?.length || 0} items</Badge>
                            </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('token')
                                                // Decode our token to see our ID
                                                const payload = JSON.parse(atob(token?.split('.')[1] || ''))
                                                if (!payload.userId) throw new Error("No user ID found")

                                                const res = await fetch(`/api/admin/deliveries/${delivery.id}`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({
                                                        claimedByWorkerId: payload.userId,
                                                        status: 'CLAIMED'
                                                    })
                                                })
                                                if (!res.ok) throw new Error("Failed to claim")
                                                toast.success("Successfully self-assigned this delivery!")
                                                window.location.reload()
                                            } catch (e: any) {
                                                toast.error(e.message || "Failed to self-assign")
                                            }
                                        }}>
                                            <Truck className="w-4 h-4 mr-2 text-primary" /> Self-Assign (Claim)
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Admin Overrides</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => {
                                            setSelectedDelivery(delivery)
                                            setStatus(delivery.status)
                                            setDeliveryMethod(delivery.deliveryMethod)
                                            setWorkerId(delivery.claimedByWorkerId || "none")
                                            setEta(delivery.eta ? format(new Date(delivery.eta), "yyyy-MM-dd'T'HH:mm") : "")
                                            setIsEditOpen(true)
                                        }}>
                                            <Edit className="w-4 h-4 mr-2" /> Dispatch & Settings
                                        </DropdownMenuItem>

                                        {delivery.status !== 'COMPLETED' && delivery.status !== 'CANCELED' && (
                                            <DropdownMenuItem
                                                className="text-destructive focus:bg-destructive/10"
                                                onClick={() => handleDelete(delivery.id)}
                                            >
                                                <Trash className="w-4 h-4 mr-2" /> Force Cancel
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        )}
                        {(userRole === 'USER' || userRole === 'WORKER') && (
                            <TableCell className="text-right">
                                {delivery.trackingCode ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors font-bold text-xs"
                                        onClick={() => {
                                            const url = `${window.location.origin}/track/${delivery.trackingCode}`
                                            navigator.clipboard.writeText(url)
                                            toast.success('Tracking link copied to clipboard!')
                                            window.open(`/track/${delivery.trackingCode}`, '_blank')
                                        }}
                                    >
                                        <Navigation className="w-3.5 h-3.5" /> Track & Share
                                    </Button>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold pr-2 tracking-widest">
                                        Preparing Dispatch
                                    </span>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )

    return (
        <div className="space-y-4">
            <Tabs defaultValue="dropoffs" className="w-full">
                <TabsList className="mb-4 bg-muted/30 p-1 rounded-lg">
                    <TabsTrigger value="dropoffs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">Outbound Dropoffs <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/20 text-blue-100">{dropoffs.length}</Badge></TabsTrigger>
                    <TabsTrigger value="pickups" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md">Inbound Pickups <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/20 text-purple-100">{pickups.length}</Badge></TabsTrigger>
                </TabsList>

                <TabsContent value="dropoffs" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border-0">
                                {renderTable(dropoffs, "No dropoffs found in the system.")}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pickups" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border-0">
                                {renderTable(pickups, "No pickups found in the system or all pickups are hidden in PAUSED state until Day -1.")}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Override Delivery Status</DialogTitle>
                        <DialogDescription>
                            Warning: Forcing a status change bypasses worker protections.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-method">Delivery Method:</Label>
                            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNAL">INTERNAL FLEET</SelectItem>
                                    <SelectItem value="GOJEK">GOJEK / GRAB</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-worker">Assign Worker:</Label>
                            <Select value={workerId || "none"} onValueChange={setWorkerId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Worker (Self-Claim/Pool)</SelectItem>
                                    {workers.map((w: any) => (
                                        <SelectItem key={w.id} value={w.id}>{w.fullName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">Assigning a worker will force-claim the delivery for them.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-eta">Scheduled ETA (Local Time):</Label>
                            <Input
                                id="edit-eta"
                                type="datetime-local"
                                value={eta}
                                onChange={(e) => setEta(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Pickups scheduled &gt;1 day away will remain PAUSED until -1 Day threshold.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status Override:</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="QUEUED">QUEUED</SelectItem>
                                    <SelectItem value="CLAIMED">CLAIMED</SelectItem>
                                    <SelectItem value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</SelectItem>
                                    <SelectItem value="PAUSED">PAUSED</SelectItem>
                                    <SelectItem value="DELAYED">DELAYED</SelectItem>
                                    <SelectItem value="CANCEL_REQUESTED">CANCEL_REQUESTED</SelectItem>
                                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                    <SelectItem value="CANCELED">CANCELED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading} variant="destructive">
                                {isLoading ? "Overriding..." : "Confirm Override"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
