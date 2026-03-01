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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImageUploadTool } from "../ImageUploadTool"

interface Product {
    id: string
    name: string
    category: string
    price: number
    description: string | null
    imageUrl: string | null
    images: string[]
    stock: number | null
    discountPercentage: number
    variants: any[]
}

interface ProductsClientProps {
    initialProducts: Product[]
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price: "",
        description: "",
        imageUrl: "",
        images: [] as string[],
        discountPercentage: "0",
        variants: [] as any[]
    })
    const [variantForm, setVariantForm] = useState({ color: "", stockQuantity: "0" })
    const [isCustomCategory, setIsCustomCategory] = useState(false)

    const resetForm = () => {
        setFormData({ name: "", category: "", price: "", description: "", imageUrl: "", images: [], discountPercentage: "0", variants: [] })
        setEditingProduct(null)
        setVariantForm({ color: "", stockQuantity: "0" })
        setIsCustomCategory(false)
    }

    const handlePdfUpload = async (key: string, file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            toast.loading(`Uploading ${file.name}...`)

            const token = localStorage.getItem('token') || ''
            const uploadRes = await fetch('/api/admin/upload-file', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (!uploadRes.ok) throw new Error(await uploadRes.text())
            const uploadData = await uploadRes.json()

            // Save to SiteSettings
            const settingsRes = await fetch('/api/admin/site-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    key,
                    value: uploadData.url,
                    section: 'marketing'
                })
            })

            if (!settingsRes.ok) throw new Error(await settingsRes.text())

            toast.dismiss()
            toast.success(`Successfully uploaded and saved to website!`)
        } catch (err: any) {
            toast.dismiss()
            toast.error(`Upload Error: ${err.message}`)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) resetForm()
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            description: product.description || "",
            imageUrl: product.imageUrl || "",
            images: product.images || (product.imageUrl ? [product.imageUrl] : []),
            discountPercentage: product.discountPercentage?.toString() || "0",
            variants: product.variants || []
        })

        // If the product belongs to a category not in the standard list, open custom mode immediately
        const defaultCats = ["Chair", "Desk", "Monitor", "Mouse And Keyboard", "Accessories", "Other"]
        if (!defaultCats.includes(product.category)) {
            setIsCustomCategory(true)
        } else {
            setIsCustomCategory(false)
        }

        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete")

            toast.success("Product deleted")
            router.refresh()
        } catch (error) {
            toast.error("Failed to delete product")
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : '/api/products'

            const method = editingProduct ? 'PUT' : 'POST'

            const finalImages = formData.images.length > 0 ? formData.images : ['/LogoTropicTech.webp']

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    category: formData.category,
                    monthlyPrice: parseFloat(formData.price),
                    description: formData.description,
                    imageUrl: finalImages[0],
                    images: finalImages,
                    discountPercentage: parseInt(formData.discountPercentage),
                    variants: formData.variants
                })
            })

            if (!res.ok) throw new Error("Failed to save")

            toast.success(editingProduct ? "Product updated" : "Product created")
            setIsOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between mb-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 md:mb-0">
                    <h2 className="font-bold text-gray-700 mr-2 text-sm uppercase tracking-wider">Global Catalogs (PDF)</h2>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('company-catalog-upload')?.click()} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        Update Company Catalog
                        <input id="company-catalog-upload" type="file" className="hidden" accept="application/pdf" onChange={(e) => {
                            if (e.target.files?.[0]) handlePdfUpload('company_catalog_url', e.target.files[0])
                        }} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('product-catalog-upload')?.click()} className="text-green-600 border-green-200 hover:bg-green-50">
                        Update Product Catalog
                        <input id="product-catalog-upload" type="file" className="hidden" accept="application/pdf" onChange={(e) => {
                            if (e.target.files?.[0]) handlePdfUpload('product_catalog_url', e.target.files[0])
                        }} />
                    </Button>
                </div>
                <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price (Monthly)</TableHead>
                            <TableHead>Stock (Cached)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{product.stock}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90"
                                            title="Delete Product (Cascades to related packages/orders)"
                                            onClick={() => handleDelete(product.id)}
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
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                            Make changes to product inventory items here.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="category">Category</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider"
                                        onClick={() => {
                                            setIsCustomCategory(!isCustomCategory)
                                            if (isCustomCategory) {
                                                setFormData({ ...formData, category: "" })
                                            }
                                        }}
                                    >
                                        {isCustomCategory ? "Use Dropdown" : "+ Add New"}
                                    </Button>
                                </div>
                                {isCustomCategory ? (
                                    <Input
                                        id="category"
                                        placeholder="Type new category name..."
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                ) : (
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                                        required
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(new Set([
                                                "Chair",
                                                "Desk",
                                                "Monitor",
                                                "Mouse And Keyboard",
                                                "Accessories",
                                                "Other",
                                                ...initialProducts.map(p => p.category)
                                            ])).map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Monthly Price (IDR)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discount">Discount (%)</Label>
                                <Input
                                    id="discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Gallery (WebP Auto-Compression)</Label>
                                <p className="text-xs text-muted-foreground mb-3">Upload high quality JPG, PNG, or HEIC files. The system will transcode and compress them to WebP to guarantee fast page loads.</p>
                            </div>
                            <ImageUploadTool
                                value={formData.images}
                                onChange={(urls) => setFormData({ ...formData, images: urls, imageUrl: urls[0] || "" })}
                                maxImages={8}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                rows={4}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Variants & Stock (By Color)</Label>

                            <div className="grid grid-cols-3 gap-2 items-end">
                                <div className="space-y-1">
                                    <Label htmlFor="color" className="text-[10px]">Color</Label>
                                    <Input
                                        id="color"
                                        placeholder="e.g. Matte Black"
                                        value={variantForm.color}
                                        onChange={e => setVariantForm({ ...variantForm, color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="vstock" className="text-[10px]">Stock</Label>
                                    <Input
                                        id="vstock"
                                        type="number"
                                        value={variantForm.stockQuantity}
                                        onChange={e => setVariantForm({ ...variantForm, stockQuantity: e.target.value })}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="font-bold border-primary/20 hover:bg-primary/5 h-10"
                                    onClick={() => {
                                        if (!variantForm.color) return;
                                        const newVariant = {
                                            color: variantForm.color,
                                            stockQuantity: parseInt(variantForm.stockQuantity) || 0,
                                            reservedQuantity: 0,
                                            sku: `${formData.name.substring(0, 3).toUpperCase()}-${variantForm.color.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`
                                        };
                                        setFormData({
                                            ...formData,
                                            variants: [...formData.variants, newVariant]
                                        });
                                        setVariantForm({ color: "", stockQuantity: "0" });
                                    }}
                                >
                                    Add Color
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.variants.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm">
                                        <div>
                                            <span className="font-extrabold text-primary">{v.color}</span>
                                            <span className="mx-2 text-zinc-300 opacity-20">|</span>
                                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 mr-2">{v.sku}</span>
                                            <Badge variant="outline" className="font-bold text-[10px]">STOCK: {v.stockQuantity}</Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    variants: formData.variants.filter((_, idx) => idx !== i)
                                                });
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/20 rounded-xl border border-dashed">No variants added yet. Add at least one for stock management.</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto font-bold px-8">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingProduct ? "UPDATE PRODUCT" : "CREATE PRODUCT"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >
        </>
    )
}
