'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, CreditCard, Wallet, Box, Archive } from "lucide-react"

interface StatCardsProps {
    stats: {
        totalUsers: number
        verifiedUsers: number
        totalTransactions: number
        totalRevenue: number
        totalProducts: number
        totalPackages: number
    }
}

export function StatCards({ stats }: StatCardsProps) {
    const cardData = [
        {
            title: "Total User",
            value: stats.totalUsers,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/20"
        },
        {
            title: "Account Terverifikasi",
            value: stats.verifiedUsers,
            icon: UserCheck,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20"
        },
        {
            title: "Total Produk",
            value: stats.totalProducts,
            icon: Box,
            color: "text-orange-600",
            bg: "bg-orange-100 dark:bg-orange-900/20"
        },
        {
            title: "Total Paket",
            value: stats.totalPackages,
            icon: Archive,
            color: "text-cyan-600",
            bg: "bg-cyan-100 dark:bg-cyan-900/20"
        },
        {
            title: "Total Transaksi",
            value: stats.totalTransactions,
            icon: CreditCard,
            color: "text-purple-600",
            bg: "bg-purple-100 dark:bg-purple-900/20"
        },
        {
            title: "Total Revenue",
            value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "bg-emerald-100 dark:bg-emerald-900/20"
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cardData.map((card, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{card.title}</CardTitle>
                        <div className={`p-1.5 rounded-lg ${card.bg}`}>
                            <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black tracking-tight">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
