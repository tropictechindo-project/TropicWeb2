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
    Bot
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNotification } from "@/contexts/NotificationContext"

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
        url: "/admin/overview",
        icon: LayoutDashboard,
    },
    {
        title: "Messages",
        url: "/admin/messages",
        icon: MessageSquare,
    },
    {
        title: "User Management",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "Workers Panel",
        url: "/admin/workers",
        icon: Users,
    },
    {
        title: "Products",
        url: "/admin/products",
        icon: Box,
    },
    {
        title: "Packages",
        url: "/admin/packages",
        icon: Package,
    },
    {
        title: "Inventory (Units)",
        url: "/admin/inventory",
        icon: Warehouse,
    },
    {
        title: "Orders / Rentals",
        url: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Invoices",
        url: "/admin/invoices",
        icon: FileText,
    },
    {
        title: "Reports",
        url: "/admin/reports",
        icon: BarChart3,
    },
    {
        title: "Website",
        url: "/admin/website",
        icon: Globe,
    },
    {
        title: "AI Control",
        url: "/admin/ai",
        icon: Bot,
    },
    {
        title: "System Control",
        url: "/admin/system",
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { unreadMessagesCount } = useNotification()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 border-b border-sidebar-border flex items-center justify-center">
                <div className="flex items-center gap-2 font-bold text-xl px-4 w-full">
                    <span className="text-primary truncate">Tropic Tech Admin</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname.startsWith(item.url)}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url} className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </div>
                                            {item.title === "Messages" && unreadMessagesCount > 0 && (
                                                <Badge variant="destructive" className="h-5 min-w-[20px] px-1 ml-auto flex items-center justify-center text-[10px] rounded-full">
                                                    {unreadMessagesCount}
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
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Back to Home">
                                    <Link href="/">
                                        <Home className="text-primary font-bold" />
                                        <span className="font-bold">BACK TO HOME</span>
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
                            tooltip="Toggle Theme"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {mounted && (theme === 'dark' ? <Sun className="text-yellow-500" /> : <Moon className="text-blue-500" />)}
                            {!mounted && <Sun className="text-muted-foreground" />}
                            <span>Toggle Theme</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Log Out">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token')
                                    window.location.href = '/auth/login'
                                }}
                                className="flex items-center gap-2 w-full"
                            >
                                <LogOut className="text-destructive" />
                                <span className="font-semibold text-destructive">LOG OUT</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Admin User</span>
                                    <span className="truncate text-xs">admin@tropictech.com</span>
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
