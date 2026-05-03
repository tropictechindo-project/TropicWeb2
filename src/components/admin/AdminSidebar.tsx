"use client"

import {
    LayoutDashboard,
    Users,
    Package,
    Box,
    Warehouse,
    ShoppingCart,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Home,
    Sun,
    Moon,
    MessageSquare,
    Globe,
    Bot,
    Truck,
    Navigation as NavigationIcon,
    ClipboardCheck,
    Map as MapIcon,
    Mail
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNotification } from "@/contexts/NotificationContext"
import { useAuth } from "@/contexts/AuthContext"
import { GlobalTrackerModal } from "@/components/shared/GlobalTrackerModal"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Menu items.
const items = [
    {
        title: "Overview",
        localizedTitle: "Ringkasan",
        url: "/admin/overview",
        icon: LayoutDashboard,
    },
    {
        title: "Messages",
        localizedTitle: "Pesan",
        url: "/admin/messages",
        icon: MessageSquare,
    },
    {
        title: "User Management",
        localizedTitle: "Manajemen Pengguna",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "Workers Panel",
        localizedTitle: "Panel Pekerja",
        url: "/admin/workers",
        icon: Users,
    },
    {
        title: "Deliveries Queue",
        localizedTitle: "Antrean Kiriman",
        url: "/admin/deliveries",
        icon: NavigationIcon,
    },
    {
        title: "Fleet & Vehicles",
        localizedTitle: "Armada & Kendaraan",
        url: "/admin/vehicles",
        icon: Truck,
    },
    {
        title: "Products",
        localizedTitle: "Produk",
        url: "/admin/products",
        icon: Box,
    },
    {
        title: "Packages",
        localizedTitle: "Paket Sewa",
        url: "/admin/packages",
        icon: Package,
    },
    {
        title: "Special Offers",
        localizedTitle: "Penawaran Khusus",
        url: "/admin/special-offers",
        icon: Package,
    },
    {
        title: "Inventory (Units)",
        localizedTitle: "Stok Barang",
        url: "/admin/inventory",
        icon: Warehouse,
    },
    {
        title: "Orders / Rentals",
        localizedTitle: "Pesanan / Sewa",
        url: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Service Requests",
        localizedTitle: "Permintaan Layanan",
        url: "/admin/requests",
        icon: ClipboardCheck,
    },
    {
        title: "Invoices",
        localizedTitle: "Tagihan / Invoice",
        url: "/admin/invoices",
        icon: FileText,
    },
    {
        title: "Email Audit",
        localizedTitle: "Audit Email",
        url: "/admin/emails",
        icon: Mail,
    },
    {
        title: "Reports",
        localizedTitle: "Laporan",
        url: "/admin/reports",
        icon: BarChart3,
    },
    {
        title: "Website",
        localizedTitle: "Situs Web",
        url: "/admin/website",
        icon: Globe,
    },
    {
        title: "AI Control",
        localizedTitle: "Kontrol AI",
        url: "/admin/ai",
        icon: Bot,
    },
    {
        title: "SEO Intelligence",
        localizedTitle: "Intelijen SEO",
        url: "/admin/seo",
        icon: BarChart3,
    },
    {
        title: "System Control",
        localizedTitle: "Kontrol Sistem",
        url: "/admin/system",
        icon: Settings,
    },
]

export function AdminSidebar() {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const { unreadMessagesCount, unreadOrdersCount, unreadDeliveriesCount } = useNotification()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 border-b border-sidebar-border flex items-center justify-center">
                <div className="flex items-center gap-2 font-bold text-xl px-4 w-full">
                    <span className="text-primary truncate">
                        {user?.role === 'OPERATOR' ? 'Panel Sistem' : 'System Panel'}
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        {user?.role === 'OPERATOR' ? 'Menu Utama' : 'Menu'}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items
                                .filter(item => {
                                    if (user?.role === 'OPERATOR') {
                                        const blocked = ["User Management", "System Control"]
                                        return !blocked.includes(item.title)
                                    }
                                    return true
                                })
                                .map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname.startsWith(item.url)}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url} className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <item.icon />
                                                    <span>
                                                        {user?.role === 'OPERATOR' ? item.localizedTitle : item.title}
                                                    </span>
                                                </div>
                                                {item.title === "Messages" && unreadMessagesCount > 0 && (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1 ml-auto flex items-center justify-center text-[10px] rounded-full">
                                                        {unreadMessagesCount}
                                                    </Badge>
                                                )}
                                                {item.title === "Orders / Rentals" && unreadOrdersCount > 0 && (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1 ml-auto flex items-center justify-center text-[10px] rounded-full">
                                                        {unreadOrdersCount}
                                                    </Badge>
                                                )}
                                                {item.title === "Deliveries Queue" && unreadDeliveriesCount > 0 && (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1 ml-auto flex items-center justify-center text-[10px] rounded-full">
                                                        {unreadDeliveriesCount}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        {user?.role === 'OPERATOR' ? 'Navigasi' : 'Navigation'}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <GlobalTrackerModal />
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={user?.role === 'OPERATOR' ? 'Peta Pelacak Global' : 'Global Tracker Map'}>
                                    <Link href="/tracking" className="bg-primary/5 hover:bg-primary/10 text-primary transition-colors">
                                        <MapIcon className="h-4 w-4" />
                                        <span className="font-bold">
                                            {user?.role === 'OPERATOR' ? 'PELACAK GLOBAL' : 'GLOBAL TRACKER'}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip={user?.role === 'OPERATOR' ? 'Kembali ke Beranda' : 'Back to Home'}>
                                    <Link href="/">
                                        <Home className="text-primary font-bold" />
                                        <span className="font-bold">
                                            {user?.role === 'OPERATOR' ? 'BERANDA' : 'BACK TO HOME'}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={user?.role === 'OPERATOR' ? 'Ganti Tema' : 'Toggle Theme'}
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {mounted && (theme === 'dark' ? <Sun className="text-yellow-500" /> : <Moon className="text-blue-500" />)}
                            {!mounted && <Sun className="text-muted-foreground" />}
                            <span>
                                {user?.role === 'OPERATOR' ? 'Ganti Tema' : 'Toggle Theme'}
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={user?.role === 'OPERATOR' ? 'Keluar Sesi' : 'Log Out'}>
                            <button
                                onClick={() => logout()}
                                className="flex items-center gap-2 w-full"
                            >
                                <LogOut className="text-destructive" />
                                <span className="font-semibold text-destructive">
                                    {user?.role === 'OPERATOR' ? 'KELUAR' : 'LOG OUT'}
                                </span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary text-white font-black">
                                        {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-black uppercase tracking-tight">{user?.fullName || 'Admin User'}</span>
                                    <span className="truncate text-[10px] text-muted-foreground font-medium">{user?.email || 'admin@tropictech.com'}</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
