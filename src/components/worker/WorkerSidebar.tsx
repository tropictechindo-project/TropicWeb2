"use client"

import {
    LayoutDashboard,
    Package,
    Navigation as NavigationIcon,
    Home,
    LogOut,
    Sun,
    Moon,
    MessageSquare,
    Users,
    ClipboardCheck,
    Bot
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
        title: "Mission Brief (Overview)",
        id: "overview",
        icon: LayoutDashboard,
    },
    {
        title: "Delivery Pool",
        id: "pool",
        icon: NavigationIcon,
    },
    {
        title: "Active Jobs",
        id: "active",
        icon: Package,
    },
    {
        title: "Delivery Tracker (Global)",
        id: "tracking",
        icon: NavigationIcon,
    },
    {
        title: "Team Comms",
        id: "chat",
        icon: Users,
    },
    {
        title: "Daily Attendance",
        id: "attendance",
        icon: ClipboardCheck,
    },
    {
        title: "T-Tech.Ai",
        id: "ai",
        icon: Bot,
    }
]

export function WorkerSidebar({ currentTab, onTabChange, userName }: { currentTab: string, onTabChange: (tab: string) => void, userName: string }) {
    const { logout } = useAuth()
    const { unreadMessagesCount } = useNotification()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 border-b border-sidebar-border flex items-center justify-center">
                <div className="flex items-center gap-2 font-bold text-xl px-4 w-full">
                    <span className="text-primary truncate">Worker Hub</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                        isActive={currentTab === item.id}
                                        tooltip={item.title}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onTabChange(item.id);
                                        }}
                                    >
                                        <div className="flex items-center justify-between w-full cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            {item.title === "Team Comms" && unreadMessagesCount > 0 && (
                                                <Badge variant="destructive" className="h-5 min-w-[20px] px-1 ml-auto flex items-center justify-center text-[10px] rounded-full">
                                                    {unreadMessagesCount}
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
                    <SidebarGroupLabel>System</SidebarGroupLabel>
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
                                onClick={() => logout()}
                                className="flex items-center gap-2 w-full"
                            >
                                <LogOut className="text-destructive h-4 w-4" />
                                <span className="font-semibold text-destructive">LOG OUT</span>
                            </button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2 mt-4 border-t pt-4 border-sidebar-border">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-blue-500/20 text-blue-600 font-bold">{userName?.substring(0, 2).toUpperCase() || 'WK'}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-primary">{userName}</span>
                                    <span className="truncate text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Field Worker</span>
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
