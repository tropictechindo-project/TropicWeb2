"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

interface GlobalTrackerModalProps {
    isCollapsed?: boolean;
}

export function GlobalTrackerModal({ isCollapsed }: GlobalTrackerModalProps) {
    const [trackingCode, setTrackingCode] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!trackingCode.trim()) {
            toast.error("Please enter a valid tracking code or invoice number.")
            return
        }

        // Push to tracking page, allowing that page to handle the fetch
        router.push(`/tracking/${trackingCode.trim()}`)
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Global Delivery Tracker">
                        <MapPin className="text-emerald-500 font-bold" />
                        {!isCollapsed && <span className="font-bold text-emerald-600 dark:text-emerald-400">GLOBAL TRACKER</span>}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        Track Delivery
                    </DialogTitle>
                    <DialogDescription>
                        Enter an Invoice Number (e.g. INV-12345678) or Tracking Code to view live GPS status and delivery details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSearch} className="flex items-center space-x-2 mt-4">
                    <div className="grid flex-1 gap-2">
                        <Input
                            id="tracking-code"
                            placeholder="INV-..."
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="font-mono"
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3">
                        <span className="sr-only">Search</span>
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
