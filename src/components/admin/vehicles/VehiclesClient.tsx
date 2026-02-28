"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Truck,
    Plus,
    MoreHorizontal,
    Trash,
    Edit,
    CheckCircle2,
    XCircle,
    Wrench,
    Bike
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
    DialogTrigger,
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

export function VehiclesClient({ initialVehicles }: { initialVehicles: any[] }) {
    const router = useRouter()
    const [vehicles, setVehicles] = useState(initialVehicles)
    const [isLoading, setIsLoading] = useState(false)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Form states
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
    const [name, setName] = useState("")
    const [type, setType] = useState("VAN")
    const [status, setStatus] = useState("AVAILABLE")

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return toast.error("Name is required")

        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, type })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add vehicle')
            }

            toast.success("Vehicle added successfully")
            setIsAddOpen(false)
            setName("")
            router.refresh()
            // In a real app we'd fetch the latest or append to state
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedVehicle) return

        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/vehicles/${selectedVehicle.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, type, status })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update vehicle')
            }

            toast.success("Vehicle updated successfully")
            setIsEditOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this vehicle?")) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/vehicles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete vehicle')
            }

            toast.success("Vehicle deleted successfully")
            setVehicles(prev => prev.filter(v => v.id !== id))
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Available</Badge>
            case 'IN_USE': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Truck className="w-3 h-3 mr-1" /> In Use</Badge>
            case 'MAINTENANCE': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Wrench className="w-3 h-3 mr-1" /> Maintenance</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Vehicle</DialogTitle>
                            <DialogDescription>
                                Add a new vehicle to TropicTech's delivery fleet.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Vehicle Name / Plate Number</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. DK 1234 AB (Van 1)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Vehicle Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VAN">Van</SelectItem>
                                        <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Vehicle"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Vehicle Info</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Active Delivery</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No vehicles in fleet. Add one above.
                                        </TableCell>
                                    </TableRow>
                                ) : vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {vehicle.type === 'VAN' ? <Truck className="w-4 h-4 text-muted-foreground" /> : <Bike className="w-4 h-4 text-muted-foreground" />}
                                                {vehicle.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-xs">{vehicle.type}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                                        <TableCell>
                                            {vehicle.status === 'IN_USE' && vehicle.deliveries && vehicle.deliveries.length > 0 ? (
                                                <div className="text-sm">
                                                    <span className="font-medium text-blue-600">Claimed by {vehicle.deliveries[0]?.claimedByWorker?.fullName || 'Worker'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedVehicle(vehicle)
                                                        setName(vehicle.name)
                                                        setType(vehicle.type)
                                                        setStatus(vehicle.status)
                                                        setIsEditOpen(true)
                                                    }}>
                                                        <Edit className="w-4 h-4 mr-2" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:bg-destructive/10"
                                                        onClick={() => handleDelete(vehicle.id)}
                                                    >
                                                        <Trash className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Vehicle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Vehicle Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Vehicle Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VAN">Van</SelectItem>
                                    <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                                    <SelectItem value="IN_USE">IN USE</SelectItem>
                                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Update Vehicle"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
