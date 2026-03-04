"use client"

import {
    LayoutDashboard,
    Package,
    Navigation,
    Home,
    LogOut,
    Sun,
    Moon,
    MessageSquare,
    ClipboardCheck,
    Bot
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNotification } from "@/contexts/NotificationContext"
import { LinkedCompanyPanel } from "@/components/shared/LinkedCompanyPanel"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const items = [
    {
        title: "Overview",
        url: "?tab=overview",
        icon: LayoutDashboard,
    },
    {
        title: "Team Chat",
        url: "?tab=chat",
        icon: MessageSquare,
    },
    {
        title: "Orders / Rentals",
        url: "?tab=orders",
        icon: Package,
    },
    {
        title: "Deliveries Queue",
        url: "?tab=deliveries",
        icon: Navigation,
    },
    {
        title: "Inventory System",
        url: "?tab=inventory",
        icon: Package,
    },
    {
        title: "Service Requests",
        url: "?tab=requests",
        icon: ClipboardCheck,
    },
    {
        title: "Workers Schedule",
        url: "?tab=schedules",
        icon: ClipboardCheck,
    },
    {
        title: "AI Master",
        url: "?tab=ai",
        icon: Bot,
    }
]

export function OperatorSidebar({ currentTab, onTabChange }: { currentTab: string, onTabChange: (tab: string) => void }) {
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
                    <span className="text-primary truncate">Operator Terminal</span>
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
                                        isActive={currentTab === item.url.split('=')[1]}
                                        tooltip={item.title}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onTabChange(item.url.split('=')[1]);
                                        }}
                                    >
                                        <div className="flex items-center justify-between w-full cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            {item.title === "Team Chat" && unreadMessagesCount > 0 && (
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
                                        </div>
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
                            <GlobalTrackerModal />
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Back to Home">
                                    <Link href="/">
                                        <Home className="text-primary font-bold h-4 w-4" />
                                        <span className="font-bold">BACK TO HOME</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <LinkedCompanyPanel />
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Toggle Theme"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {mounted && (theme === 'dark' ? <Sun className="text-yellow-500 h-4 w-4" /> : <Moon className="text-blue-500 h-4 w-4" />)}
                            {!mounted && <Sun className="text-muted-foreground h-4 w-4" />}
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
                                <LogOut className="text-destructive h-4 w-4" />
                                <span className="font-semibold text-destructive">LOG OUT</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary/20 text-primary">OP</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-primary">Operator Access</span>
                                    <span className="truncate text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Command Center</span>
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
