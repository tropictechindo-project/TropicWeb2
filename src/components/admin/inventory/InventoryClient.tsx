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
import { Loader2, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface ProductAsset {
    id: string
    productId: string
    name: string
    category: string
    total: number
    available: number
    rented: number
    status: string
}

interface Product {
    id: string
    name: string
}

interface InventoryClientProps {
    productAssets: ProductAsset[]
    products: Product[]
}

export function InventoryClient({ productAssets, products }: InventoryClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
    const [editingAsset, setEditingAsset] = useState<ProductAsset | null>(null)
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reconcile Asset Units</DialogTitle>
                        <DialogDescription>
                            Manually adjust the counts for <strong>{editingAsset?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onEditAssetSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase">Total Stock</Label>
                                <Input
                                    type="number"
                                    value={editFormData.total}
                                    onChange={e => {
                                        const total = parseInt(e.target.value) || 0
                                        setEditFormData({
                                            ...editFormData,
                                            total,
                                            available: total - editFormData.rented
                                        })
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-orange-600">Reserved (Rented)</Label>
                                <Input
                                    type="number"
                                    value={editFormData.rented}
                                    onChange={e => {
                                        const rented = parseInt(e.target.value) || 0
                                        setEditFormData({
                                            ...editFormData,
                                            rented,
                                            available: editFormData.total - rented
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

            <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="text-[10px] uppercase font-black">Variant Name</TableHead>
                            <TableHead className="text-[10px] uppercase font-black">Type</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center">Available</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center text-orange-600">Reserved</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center">Total Stock</TableHead>
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
        </div>
    )
}
