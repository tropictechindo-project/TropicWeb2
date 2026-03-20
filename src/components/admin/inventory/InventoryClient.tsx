"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ProductAsset {
    id: string
    productId: string
    name: string
    category: string
    total: number
    available: number
    reserved: number
    rented: number
    maintenance: number
    lost: number
    status: string
}

interface Product {
    id: string
    name: string
}

interface InventoryClientProps {
    productAssets: ProductAsset[]
    products: Product[]
    inventoryUnits?: any[] // Support Discrete Rows
}

export function InventoryClient({ productAssets, products, inventoryUnits = [] }: InventoryClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
    const [editingAsset, setEditingAsset] = useState<any>(null)
    const [isEditUnitOpen, setIsEditUnitOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<any>(null)
    const [editFormData, setEditFormData] = useState({
        total: 0,
        rented: 0,
        available: 0
    })

    const handleEditAsset = (asset: ProductAsset) => {
        setEditingAsset(asset)
        setEditFormData({
            total: asset.total,
            rented: asset.rented,
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
                    variantId: editingAsset.id,
                    total: editFormData.total,
                    reserved: editFormData.rented,
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

    return (
        <div className="space-y-6">
            <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Edit2 className="w-4 h-4 text-primary" />
                             </div>
                             Inventory Manager: {editingAsset?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Configure individual asset units and track ROI for this product model.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                         {/* Quick Adjust Numbers */}
                         <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                              <div className="space-y-1">
                                   <Label className="text-[10px] font-black uppercase text-muted-foreground">Total Units</Label>
                                   <div className="text-xl font-black">{editingAsset?.total || 0}</div>
                              </div>
                              <div className="space-y-1">
                                   <Label className="text-[10px] font-black uppercase text-green-600">Available</Label>
                                   <div className="text-xl font-black text-green-600">{editingAsset?.available || 0}</div>
                              </div>
                              <div className="space-y-1 text-right">
                                   <Button 
                                       size="sm" 
                                       className="h-8 font-black text-[10px] uppercase px-4"
                                       onClick={async () => {
                                            const newTotal = (editingAsset?.total || 0) + 1
                                            setIsLoading(true)
                                            try {
                                                const res = await fetch('/api/admin/inventory/adjust', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        variantId: editingAsset?.defaultVariantId || editingAsset?.id,
                                                        total: newTotal,
                                                        reserved: editingAsset?.rented || 0,
                                                    })
                                                })
                                                if (!res.ok) throw new Error("Failed")
                                                toast.success(`Unit added successfully!`)
                                                router.refresh()
                                                setIsEditAssetOpen(false)
                                            } catch {
                                                toast.error("Failed to add unit")
                                            } finally {
                                                setIsLoading(false)
                                            }
                                       }}
                                       disabled={isLoading}
                                   >
                                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                        Quick Add 1 Unit
                                   </Button>
                              </div>
                         </div>

                         {/* Unit List */}
                         <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                   Individual Asset Units
                              </h4>
                              <div className="rounded-xl border border-muted bg-neutral-50/50 overflow-hidden">
                                   <Table>
                                        <TableHeader className="bg-muted/50">
                                             <TableRow>
                                                  <TableHead className="text-[10px] font-black uppercase">Asset ID / Serial</TableHead>
                                                  <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                                                  <TableHead className="text-[10px] font-black uppercase text-center">Cost</TableHead>
                                                  <TableHead className="text-[10px] font-black uppercase text-center">ROI</TableHead>
                                                  <TableHead className="text-[10px] font-black uppercase text-right">Edit</TableHead>
                                             </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                             {inventoryUnits
                                                  .filter(u => u.variant?.productId === editingAsset?.productId)
                                                  .map((unit: any) => (
                                                       <TableRow key={unit.id} className="hover:bg-muted/20">
                                                            <TableCell className="font-mono text-[10px] font-bold text-primary py-3">
                                                                 {unit.assetTag || unit.serialNumber}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                 <Badge className="text-[9px] font-black px-1.5 h-5 uppercase">
                                                                      {unit.status}
                                                                 </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold text-[10px]">
                                                                 Rp {Number(unit.purchasePrice || 0).toLocaleString('id-ID')}
                                                            </TableCell>
                                                            <TableCell className="text-center font-black text-[10px] text-blue-600">
                                                                 {Number(unit.purchasePrice) > 0 
                                                                      ? ((Number(unit.revenue || 0) / Number(unit.purchasePrice)) * 100).toFixed(1)
                                                                      : '0.0'}%
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                 <Button 
                                                                      variant="ghost" 
                                                                      size="icon" 
                                                                      className="h-6 w-6"
                                                                      onClick={() => {
                                                                           setEditingUnit(unit)
                                                                           setIsEditUnitOpen(true)
                                                                      }}
                                                                 >
                                                                      <Edit2 className="h-3 w-3" />
                                                                 </Button>
                                                            </TableCell>
                                                       </TableRow>
                                                  ))}
                                             {inventoryUnits.filter(u => u.variant?.productId === editingAsset?.productId).length === 0 && (
                                                  <TableRow>
                                                       <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground italic">
                                                            No units registered for this product variant.
                                                       </TableCell>
                                                  </TableRow>
                                             )}
                                        </TableBody>
                                   </Table>
                              </div>
                         </div>
                    </div>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsEditAssetOpen(false)} className="font-black text-xs uppercase px-8 border-primary/20 hover:bg-primary/5">
                            Close Inventory Manager
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Unit Dialog */}
            <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase">Edit Asset Unit</DialogTitle>
                        <DialogDescription>
                            Update the status and tracking details for this specific physical unit.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset Tag / ID</Label>
                            <div className="font-mono text-sm font-bold bg-muted p-2 rounded border">{editingUnit?.assetTag}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit-status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                                <Select 
                                    value={editingUnit?.status} 
                                    onValueChange={(val) => setEditingUnit({ ...editingUnit, status: val })}
                                >
                                    <SelectTrigger id="unit-status">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                                        <SelectItem value="RESERVED">RESERVED</SelectItem>
                                        <SelectItem value="RENTED">RENTED</SelectItem>
                                        <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                                        <SelectItem value="LOST">LOST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit-condition" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condition</Label>
                                <Select 
                                    value={editingUnit?.condition} 
                                    onValueChange={(val) => setEditingUnit({ ...editingUnit, condition: val })}
                                >
                                    <SelectTrigger id="unit-condition">
                                        <SelectValue placeholder="Select Condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GOOD">GOOD</SelectItem>
                                        <SelectItem value="FAIR">FAIR</SelectItem>
                                        <SelectItem value="DAMAGED">DAMAGED</SelectItem>
                                        <SelectItem value="NEEDS_SERVICE">NEEDS SERVICE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit-serial" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Serial Number</Label>
                            <Input 
                                id="unit-serial"
                                value={editingUnit?.serialNumber}
                                onChange={(e) => setEditingUnit({ ...editingUnit, serialNumber: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                             <Label htmlFor="unit-price" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buy Price (Acquisition Cost)</Label>
                             <div className="relative">
                                 <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-bold">Rp</span>
                                 <Input 
                                     id="unit-price"
                                     type="number"
                                     className="pl-10 font-bold"
                                     placeholder="0"
                                     value={editingUnit?.purchasePrice}
                                     onChange={(e) => setEditingUnit({ ...editingUnit, purchasePrice: e.target.value })}
                                 />
                             </div>
                         </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditUnitOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button 
                            className="font-black uppercase"
                            disabled={isLoading}
                            onClick={async () => {
                                setIsLoading(true)
                                try {
                                    const res = await fetch(`/api/admin/inventory/units/${editingUnit.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            status: editingUnit.status,
                                            condition: editingUnit.condition,
                                            serialNumber: editingUnit.serialNumber,
                                            purchasePrice: editingUnit.purchasePrice
                                        })
                                    })
                                    if (!res.ok) throw new Error("Failed")
                                    toast.success("Unit updated successfully")
                                    router.refresh()
                                    setIsEditUnitOpen(false)
                                } catch {
                                    toast.error("Failed to update unit")
                                } finally {
                                    setIsLoading(false)
                                }
                            }}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] uppercase font-black">Variant Name</TableHead>
                            <TableHead className="text-[10px] uppercase font-black">Type</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-green-600">Available</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-blue-600">Reserved</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-orange-600">Rented</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-yellow-600">Maint.</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-red-600">Lost</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center">Total</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center">Health</TableHead>
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
                                <TableCell className="text-center font-black text-blue-600">{asset.reserved}</TableCell>
                                <TableCell className="text-center font-black text-orange-600">{asset.rented}</TableCell>
                                <TableCell className="text-center font-black text-yellow-600">{asset.maintenance}</TableCell>
                                <TableCell className="text-center font-black text-red-600">{asset.lost}</TableCell>
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
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] font-black uppercase h-8 px-3 border-primary/20 hover:bg-primary/5"
                                        onClick={() => handleEditAsset(asset)}
                                    >
                                        Manage
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {inventoryUnits && inventoryUnits.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-black tracking-tight uppercase text-orange-600">Discrete Asset Units (Single Tracking)</h3>
                        <p className="text-xs text-muted-foreground italic font-medium">Individual tracking of serialized items and financial breakdown</p>
                    </div>
                    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="text-[10px] uppercase font-black">Serial / Asset Tag</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black">Product</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black">Acquisition Cost</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-center">Status</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-center text-blue-600">ROI (%)</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-center text-green-600">Revenue</TableHead>
                                    <TableHead className="text-[10px] uppercase font-black text-right">Health</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryUnits.map((u: any) => {
                                    const revenue = Number(u.revenue || 0)
                                    const cost = Number(u.purchasePrice || 0)
                                    const roiPercent = cost > 0 ? (revenue / cost) * 100 : 0
                                    
                                    return (
                                        <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-mono text-xs font-bold text-primary">
                                                {u.assetTag || u.serialNumber || 'NO_ID'}
                                            </TableCell>
                                            <TableCell className="font-medium text-xs">
                                                {u.variant?.product?.name || 'Generic / Unlinked'}
                                                {u.variant?.color !== 'STANDARD' && (
                                                    <span className="ml-1 text-[9px] text-muted-foreground">({u.variant?.color})</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold">
                                                Rp {(cost).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={u.status === 'AVAILABLE' ? 'default' : u.status === 'RENTED' ? 'destructive' : 'secondary'}
                                                    className="text-[9px] font-black px-2 uppercase h-5"
                                                >
                                                    {u.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center text-xs font-black text-blue-600">
                                                {roiPercent.toFixed(1)}%
                                            </TableCell>
                                            <TableCell className="text-center text-xs font-black text-green-600">
                                                Rp {(revenue).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {roiPercent >= 100 ? (
                                                    <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-200 font-bold px-1.5 h-5">
                                                        PAID OFF
                                                    </Badge>
                                                ) : roiPercent > 0 ? (
                                                    <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 font-bold px-1.5 h-5">
                                                        RECOUPING
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] bg-zinc-50 text-zinc-400 border-zinc-200 font-bold px-1.5 h-5">
                                                        NEW
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
