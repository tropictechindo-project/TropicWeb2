"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface PackageItem {
    id?: string // Optional for new items
    productId: string
    name: string
    quantity: number
}

interface Package {
    id: string
    name: string
    description: string | null
    price: number
    duration: number
    imageUrl: string | null
    items: PackageItem[]
    isDeletable: boolean
}

interface ProductOption {
    id: string
    name: string
    price: number
}

interface PackagesClientProps {
    initialPackages: Package[]
    availableProducts: ProductOption[]
}

export function PackagesClient({ initialPackages, availableProducts }: PackagesClientProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration: "1", // Default 1 month
        imageUrl: ""
    })
    const [selectedItems, setSelectedItems] = useState<PackageItem[]>([])

    // Item Adding State
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [itemQuantity, setItemQuantity] = useState<string>("1")

    const resetForm = () => {
        setFormData({ name: "", description: "", price: "", duration: "1", imageUrl: "" })
        setSelectedItems([])
        setEditingId(null)
        setSelectedProductId("")
        setItemQuantity("1")
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) resetForm()
    }

    const handleEdit = (pkg: Package) => {
        setEditingId(pkg.id)
        setFormData({
            name: pkg.name,
            description: pkg.description || "",
            price: pkg.price.toString(),
            duration: pkg.duration.toString(),
            imageUrl: pkg.imageUrl || ""
        })
        setSelectedItems([...pkg.items])
        setIsOpen(true)
    }

    const handleAddItem = () => {
        if (!selectedProductId) return
        const product = availableProducts.find(p => p.id === selectedProductId)
        if (!product) return

        const existing = selectedItems.find(i => i.productId === selectedProductId)
        if (existing) {
            setSelectedItems(selectedItems.map(i =>
                i.productId === selectedProductId
                    ? { ...i, quantity: i.quantity + parseInt(itemQuantity) }
                    : i
            ))
        } else {
            setSelectedItems([...selectedItems, {
                productId: product.id,
                name: product.name,
                quantity: parseInt(itemQuantity)
            }])
        }
        setSelectedProductId("")
        setItemQuantity("1")
    }

    const handleRemoveItem = (productId: string) => {
        setSelectedItems(selectedItems.filter(i => i.productId !== productId))
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        try {
            await fetch(`/api/packages/${id}`, { method: 'DELETE' })
            toast.success("Package deleted")
            router.refresh()
        } catch {
            toast.error("Failed to delete")
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedItems.length === 0) {
            toast.error("Package must have at least one item")
            return
        }
        setIsLoading(true)

        try {
            const url = editingId ? `/api/packages/${editingId}` : '/api/packages'
            const method = editingId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    duration: parseInt(formData.duration),
                    imageUrl: formData.imageUrl,
                    items: selectedItems.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity
                    }))
                })
            })

            if (!res.ok) throw new Error("Failed to save")

            toast.success("Package saved")
            setIsOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Failed to save package")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Package
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Duration (Months)</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialPackages.map((pkg) => (
                            <TableRow key={pkg.id}>
                                <TableCell className="font-medium">{pkg.name}</TableCell>
                                <TableCell>{pkg.duration}</TableCell>
                                <TableCell>Rp {pkg.price.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{pkg.items.length} items</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            disabled={!pkg.isDeletable}
                                            onClick={() => handleDelete(pkg.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-xl overflow-y-auto max-h-[95vh]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Package" : "Create Package"}</DialogTitle>
                        <DialogDescription>Configurate package details and included items.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Package Name</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (IDR)</Label>
                                <Input id="price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Months)</Label>
                                <Input id="duration" type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea id="description" value={formData.description} rows={3} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Photo / Image Link</Label>
                            <Input
                                id="imageUrl"
                                placeholder="https://example.com/image.jpg"
                                value={formData.imageUrl}
                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                            {formData.imageUrl && (
                                <div className="mt-2 relative h-32 w-full overflow-hidden rounded-xl border bg-muted">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Package Items</Label>
                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProducts.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-20">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={itemQuantity}
                                        onChange={e => setItemQuantity(e.target.value)}
                                        placeholder="Qty"
                                    />
                                </div>
                                <Button type="button" onClick={handleAddItem} disabled={!selectedProductId} variant="secondary">Add</Button>
                            </div>

                            <div className="bg-muted/50 rounded-xl p-3 space-y-2 mt-2 border border-dashed">
                                {selectedItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No items added to this package yet</p>}
                                {selectedItems.map((item, idx) => (
                                    <div key={`${item.productId}-${idx}`} className="flex justify-between items-center bg-card p-2 px-3 rounded-lg border shadow-sm text-sm">
                                        <span className="font-medium">{item.name} <span className="text-primary font-black ml-2">x{item.quantity}</span></span>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item.productId)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full font-bold">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                SAVE PACKAGE CONFIGURATION
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
