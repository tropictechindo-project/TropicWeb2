"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Loader2, Edit2, Search } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Unit {
    id: string
    unitCode: string
    status: string
    productId: string
    productName: string
    category: string
    purchaseDate: string
}

interface ProductAsset {
    id: string
    name: string
    category: string
    total: number
    available: number
    rented: number
    broken: number // Added broken field
    status: string
}

interface Product {
    id: string
    name: string
}

interface InventoryClientProps {
    initialUnits: Unit[]
    productAssets: ProductAsset[]
    products: Product[]
}

export function InventoryClient({ initialUnits, productAssets, products }: InventoryClientProps) {
    const router = useRouter()
    const [units, setUnits] = useState(initialUnits) // Use local state for immediate optimistic updates if desired, but router.refresh is safer
    const [isLoading, setIsLoading] = useState(false)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
    const [editingAsset, setEditingAsset] = useState<ProductAsset | null>(null)
    const [editFormData, setEditFormData] = useState({
        total: 0,
        rented: 0,
        broken: 0, // Added broken field
        available: 0
    })

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [search, setSearch] = useState("")

    // Add Unit Form
    const [addFormData, setAddFormData] = useState({
        productId: "",
        quantity: "1",
        purchaseDate: new Date().toISOString().split('T')[0]
    })

    const filteredUnits = initialUnits.filter(u => {
        const matchesStatus = statusFilter === "ALL" || u.status === statusFilter
        const matchesSearch = u.unitCode.toLowerCase().includes(search.toLowerCase()) ||
            u.productName.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addFormData)
            })
            if (!res.ok) throw new Error("Failed")

            toast.success("Units generated successfully")
            setIsAddOpen(false)
            router.refresh()
        } catch {
            toast.error("Failed to generate units")
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            // Optimistic update could go here
            await fetch(`/api/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            toast.success("Status updated")
            router.refresh()
        } catch {
            toast.error("Update failed")
        }
    }

    const handleEditAsset = (asset: ProductAsset) => {
        setEditingAsset(asset)
        setEditFormData({
            total: asset.total,
            rented: asset.rented,
            broken: asset.broken, // Added broken setting
            available: asset.available
        })
        setIsEditAssetOpen(true)
    }

    const onEditAssetSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAsset) return
        setIsLoading(true)

        try {
            const res = await fetch('/api/admin/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: editingAsset.id,
                    total: editFormData.total,
                    rented: editFormData.rented,
                    broken: editFormData.broken // Send broken field
                })
            })

            if (!res.ok) throw new Error("Failed")
            toast.success("Asset reconciliation successful")
            setIsEditAssetOpen(false)
            router.refresh()
        } catch {
            toast.error("Failed to adjust asset units")
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'default' // primary/black
            case 'IN_USE': return 'secondary' // gray
            case 'DAMAGED': return 'destructive' // red
            default: return 'outline'
        }
    }

    const getStatusLabel = (status: string) => {
        if (status === 'DAMAGED') return 'BROKEN'
        if (status === 'IN_USE') return 'RENTED'
        return status
    }

    return (
        <Tabs defaultValue="assets" className="space-y-6">
            <div className="flex justify-between items-center">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="assets" className="rounded-lg font-bold uppercase text-xs px-6">Assets Overview</TabsTrigger>
                    <TabsTrigger value="units" className="rounded-lg font-bold uppercase text-xs px-6">Individual Units</TabsTrigger>
                </TabsList>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold border-2">
                            <Plus className="mr-2 h-4 w-4" /> ADD NEW UNITS
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        {/* ... existing dialog content ... */}
                        <DialogHeader>
                            <DialogTitle>Add New Inventory Units</DialogTitle>
                            <DialogDescription>
                                Select a product and quantity. Unique unit codes will be generated automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Product</Label>
                                <Select
                                    value={addFormData.productId}
                                    onValueChange={(val) => setAddFormData({ ...addFormData, productId: val })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={addFormData.quantity}
                                    onChange={(e) => setAddFormData({ ...addFormData, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Purchase Date</Label>
                                <Input
                                    type="date"
                                    value={addFormData.purchaseDate}
                                    onChange={(e) => setAddFormData({ ...addFormData, purchaseDate: e.target.value })}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading} className="w-full font-black">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    GENERATE UNITS NOW
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reconcile Asset Units</DialogTitle>
                            <DialogDescription>
                                Manually adjust the counts for <strong>{editingAsset?.name}</strong>.
                                Total units will be increased or decreased (AVAILABLE only) to match your target.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={onEditAssetSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Total</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.total}
                                        onChange={e => {
                                            const total = parseInt(e.target.value) || 0
                                            setEditFormData({
                                                ...editFormData,
                                                total,
                                                available: total - editFormData.rented - editFormData.broken
                                            })
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-orange-600">Rented</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.rented}
                                        onChange={e => {
                                            const rented = parseInt(e.target.value) || 0
                                            setEditFormData({
                                                ...editFormData,
                                                rented,
                                                available: editFormData.total - rented - editFormData.broken
                                            })
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-red-600">Broken</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.broken}
                                        onChange={e => {
                                            const broken = parseInt(e.target.value) || 0
                                            setEditFormData({
                                                ...editFormData,
                                                broken,
                                                available: editFormData.total - editFormData.rented - broken
                                            })
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border border-dashed flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Resulting Available</span>
                                <span className="text-lg font-black text-green-600">{editFormData.available}</span>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading} className="w-full font-black">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    SAVE RECONCILIATION
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <TabsContent value="assets" className="space-y-6">
                <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-black">Asset / Product Name</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Type</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-center">Available</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-center text-orange-600">Rented</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-center text-red-600">Broken</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-center">Total Units</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-center">Health Status</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productAssets.map((asset) => (
                                <TableRow key={asset.id} className="hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold py-4">{asset.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{asset.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-black text-green-600">{asset.available}</TableCell>
                                    <TableCell className="text-center font-black text-orange-600">{asset.rented}</TableCell>
                                    <TableCell className="text-center font-black text-red-600">{asset.broken}</TableCell>
                                    <TableCell className="text-center font-bold text-muted-foreground">{asset.total}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={asset.status === 'HEALTHY' ? 'default' : 'destructive'}
                                            className="font-black text-[10px] px-3 h-6"
                                        >
                                            {asset.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleEditAsset(asset)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="units" className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search unit codes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-card/50 pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-card/50">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="AVAILABLE">Available</SelectItem>
                                <SelectItem value="IN_USE">Rented</SelectItem>
                                <SelectItem value="DAMAGED">Broken</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-black">Unit Code</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Product</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Category</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Purchased</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Status</TableHead>
                                <TableHead className="text-[10px] uppercase font-black text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground italic">
                                        No individual units found matching the criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-muted/20">
                                        <TableCell className="font-mono font-bold text-primary">{unit.unitCode}</TableCell>
                                        <TableCell className="font-medium">{unit.productName}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{unit.category}</TableCell>
                                        <TableCell className="text-xs">{new Date(unit.purchaseDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(unit.status) as any} className="font-black text-[10px]">
                                                {getStatusLabel(unit.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={unit.status}
                                                onValueChange={(val) => handleStatusChange(unit.id, val)}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 ml-auto text-[10px] font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                                    <SelectItem value="IN_USE">Rented</SelectItem>
                                                    <SelectItem value="DAMAGED">Broken</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
        </Tabs>
    )
}
