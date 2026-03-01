"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ImageUploadTool } from "../ImageUploadTool"

interface SpecialOffer {
    id: string
    title: string
    description: string
    badgeText: string | null
    discountPercentage: number
    originalPrice: number
    finalPrice: number
    images: string[]
    isActive: boolean
    createdAt: string
}

interface SpecialOffersClientProps {
    initialOffers: SpecialOffer[]
    initialSettings: Record<string, string>
}

export function SpecialOffersClient({ initialOffers, initialSettings }: SpecialOffersClientProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null)

    const [headerSettings, setHeaderSettings] = useState({
        title: initialSettings?.special_offers_title || "SPECIAL OFFERS",
        description: initialSettings?.special_offers_description || "Exclusive limited-time promotions on our premium workstation setups. Grab these deals while they last!"
    })

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        badgeText: "",
        discountPercentage: "0",
        originalPrice: "",
        finalPrice: "",
        images: [] as string[],
        isActive: true
    })

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            badgeText: "",
            discountPercentage: "0",
            originalPrice: "",
            finalPrice: "",
            images: [],
            isActive: true
        })
        setEditingOffer(null)
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) resetForm()
    }

    const handleEdit = (offer: SpecialOffer) => {
        setEditingOffer(offer)
        setFormData({
            title: offer.title,
            description: offer.description,
            badgeText: offer.badgeText || "",
            discountPercentage: offer.discountPercentage.toString(),
            originalPrice: offer.originalPrice.toString(),
            finalPrice: offer.finalPrice.toString(),
            images: offer.images || [],
            isActive: offer.isActive
        })
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return

        try {
            const res = await fetch(`/api/special-offers/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Failed to delete")

            toast.success("Special Offer deleted")
            router.refresh()
        } catch (error) {
            toast.error("Failed to delete offer")
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = editingOffer
                ? `/api/special-offers/${editingOffer.id}`
                : '/api/special-offers'

            const method = editingOffer ? 'PUT' : 'POST'

            const finalImages = formData.images.length > 0 ? formData.images : ['/LogoTropicTech.webp']

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    images: finalImages
                })
            })

            if (!res.ok) throw new Error("Failed to save")

            toast.success(editingOffer ? "Offer updated successfully" : "Offer created successfully")
            setIsOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-calculate final price based on original price and discount
    const autoCalculatePrice = (originalStr: string, discountStr: string) => {
        const original = parseFloat(originalStr) || 0;
        const discount = parseInt(discountStr) || 0;
        const rawFinal = original - (original * (discount / 100));
        setFormData(prev => ({ ...prev, originalPrice: originalStr, discountPercentage: discountStr, finalPrice: Math.round(rawFinal).toString() }));
    }

    const saveHeaderSettings = async () => {
        setIsSavingSettings(true)
        try {
            const token = localStorage.getItem('token') || ''
            const updates = [
                { key: 'special_offers_title', value: headerSettings.title, section: 'landing' },
                { key: 'special_offers_description', value: headerSettings.description, section: 'landing' }
            ]

            for (const update of updates) {
                const res = await fetch('/api/admin/site-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(update)
                })
                if (!res.ok) throw new Error("Failed to save settings")
            }

            toast.success("Landing page header settings updated.")
        } catch (error) {
            toast.error("Failed to update site settings.")
        } finally {
            setIsSavingSettings(false)
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                    <div>
                        <h3 className="font-bold text-lg">Landing Page Header Settings</h3>
                        <p className="text-sm text-muted-foreground">Adjust the title and descriptive text shown above the Special Offers cards on the main webpage.</p>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Main Title</Label>
                            <Input
                                value={headerSettings.title}
                                onChange={(e) => setHeaderSettings(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g. SPECIAL OFFER"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Description Subtext</Label>
                            <Textarea
                                value={headerSettings.description}
                                onChange={(e) => setHeaderSettings(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g. Special on Nyepi-Holyday..."
                                rows={2}
                            />
                        </div>
                        <Button
                            onClick={saveHeaderSettings}
                            disabled={isSavingSettings}
                            className="w-full mt-2"
                        >
                            {isSavingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Header Text
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col justify-end items-end pb-4">
                    <Button onClick={() => setIsOpen(true)} size="lg" className="h-14 px-8 shadow-md font-bold text-lg">
                        <Plus className="mr-2 h-5 w-5" /> Create New Offer
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Promo Title</TableHead>
                            <TableHead>Badge</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Standard Price</TableHead>
                            <TableHead>Promo Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialOffers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No special offers configured.
                                </TableCell>
                            </TableRow>
                        ) : initialOffers.map((offer) => (
                            <TableRow key={offer.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary" />
                                        {offer.title}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {offer.badgeText && <Badge variant="secondary">{offer.badgeText}</Badge>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="destructive" className="font-bold">{offer.discountPercentage}% OFF</Badge>
                                </TableCell>
                                <TableCell className="line-through text-muted-foreground decoration-2 text-xs">
                                    Rp {offer.originalPrice.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-primary font-bold">
                                    Rp {offer.finalPrice.toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell>
                                    {offer.isActive
                                        ? <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-none">Active</Badge>
                                        : <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                                    }
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90"
                                            onClick={() => handleDelete(offer.id)}
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
                        <DialogTitle>{editingOffer ? "Edit Special Offer" : "Create Special Offer"}</DialogTitle>
                        <DialogDescription>
                            Configure the flash sale or promotion details here. Limited to displaying 3 active items on the landing page.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-primary">Active Promotion</Label>
                                <p className="text-xs text-muted-foreground">Toggle this promotion's visibility on the live site.</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Promotion Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Nyepi Mega Sale"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="badge">Highlight Badge</Label>
                                <Input
                                    id="badge"
                                    placeholder="e.g. LIMITED HOLIDAY DEAL"
                                    value={formData.badgeText}
                                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-xl border">
                            <div className="space-y-2">
                                <Label htmlFor="oprice" className="text-muted-foreground">Standard Price</Label>
                                <Input
                                    id="oprice"
                                    type="number"
                                    placeholder="Base price"
                                    value={formData.originalPrice}
                                    onChange={(e) => autoCalculatePrice(e.target.value, formData.discountPercentage)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="disc" className="text-destructive font-bold">&nbsp;Discount %</Label>
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 w-6 h-6 bg-background rounded-full border shadow-sm flex items-center justify-center text-xs pb-0.5 pointer-events-none">
                                    %
                                </div>
                                <Input
                                    id="disc"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    className="border-destructive/50 focus-visible:ring-destructive/30 text-destructive font-bold"
                                    onChange={(e) => autoCalculatePrice(formData.originalPrice, e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fprice" className="text-primary font-bold">New Sale Price</Label>
                                <Input
                                    id="fprice"
                                    type="number"
                                    className="border-primary/50 focus-visible:ring-primary/30 text-primary font-bold bg-primary/5"
                                    value={formData.finalPrice}
                                    onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Promo Graphics</Label>
                                <p className="text-xs text-muted-foreground mt-1">Upload exactly what you want customers to see for this specific offer. Generates to WebP.</p>
                            </div>
                            <ImageUploadTool
                                value={formData.images}
                                onChange={(urls) => setFormData({ ...formData, images: urls })}
                                maxImages={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Terms & Description</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                placeholder="Explain what the promo gets them..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto font-bold px-8">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingOffer ? "UPDATE OFFER" : "LAUNCH OFFER"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
