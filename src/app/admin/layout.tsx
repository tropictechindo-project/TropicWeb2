'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import Header from "@/components/header/Header"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login')
            } else if (user?.role !== 'ADMIN') {
                router.push('/')
            }
        }
    }, [isLoading, isAuthenticated, user, router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user || user.role !== 'ADMIN') {
        return null // Return null while redirecting
    }

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="relative">
                <Header />
                <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 pt-24 bg-background min-h-[calc(100vh-4rem)]">
                    <div className="flex items-center justify-between border-b pb-4 border-border/50">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="-ml-1" />
                            <div className="h-6 w-px bg-border mx-2" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary block leading-none">System Administration</span>
                                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Control <span className="text-primary">Center</span></h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-full px-4 border-primary/20 bg-primary/5 text-primary text-[10px] font-black">ROOT ACCESS</Badge>
                        </div>
                    </div>
                    <div className="animate-in fade-in duration-500 flex-1">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
