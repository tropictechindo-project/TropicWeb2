'use client'

import {
    Users, UserCheck, CreditCard, Wallet, Box, Archive,
    ShoppingCart, AlertTriangle
} from 'lucide-react'
import { StatCardWithPopup } from '@/components/ui/stat-card'

interface StatCardsProps {
    stats: {
        totalUsers: number
        verifiedUsers: number
        totalTransactions: number
        totalRevenue: number
        totalProducts: number
        totalPackages: number
        activeOrders?: number
        unresolvedConflicts?: number
    }
}

export function StatCards({ stats }: StatCardsProps) {
    const unverifiedUsers = stats.totalUsers - stats.verifiedUsers

    const cardData = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/20',
            description: 'All registered user accounts on the platform, including unverified accounts.',
            popupDetails: [
                { label: 'Verified Accounts', value: stats.verifiedUsers },
                { label: 'Unverified Accounts', value: unverifiedUsers },
                {
                    label: 'Verification Rate',
                    value: stats.totalUsers > 0 ? `${Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}%` : '0%',
                    badge: {
                        text: stats.totalUsers > 0 && (stats.verifiedUsers / stats.totalUsers) >= 0.8 ? 'Healthy' : 'Improve',
                        className: stats.totalUsers > 0 && (stats.verifiedUsers / stats.totalUsers) >= 0.8
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    }
                }
            ]
        },
        {
            title: 'Verified Accounts',
            value: stats.verifiedUsers,
            icon: UserCheck,
            color: 'text-green-600',
            bg: 'bg-green-100 dark:bg-green-900/20',
            description: 'Users who have confirmed their email address and can place orders.',
            popupDetails: [
                { label: 'Total Users', value: stats.totalUsers },
                { label: 'Verified', value: stats.verifiedUsers, badge: { text: 'Active', className: 'bg-green-500/10 text-green-600 border-green-500/20' } },
                { label: 'Pending Verification', value: unverifiedUsers }
            ]
        },
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Box,
            color: 'text-orange-600',
            bg: 'bg-orange-100 dark:bg-orange-900/20',
            description: 'Total number of individual products in the rental catalog. Go to Products page to manage stock, variants, and pricing.',
            popupDetails: [
                { label: 'Rental Packages', value: stats.totalPackages },
                { label: 'Individual Products', value: stats.totalProducts },
                { label: 'Total Catalog Items', value: stats.totalProducts + stats.totalPackages }
            ]
        },
        {
            title: 'Total Packages',
            value: stats.totalPackages,
            icon: Archive,
            color: 'text-cyan-600',
            bg: 'bg-cyan-100 dark:bg-cyan-900/20',
            description: 'Bundled rental packages combining multiple products at a unified price.',
            popupDetails: [
                { label: 'Individual Products', value: stats.totalProducts },
                { label: 'Rental Packages', value: stats.totalPackages }
            ]
        },
        {
            title: 'Total Transactions',
            value: stats.totalTransactions,
            icon: CreditCard,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/20',
            description: 'Total number of invoices ever created. Includes PAID, PENDING, and CANCELLED invoices.',
            popupDetails: [
                { label: 'All Invoices', value: stats.totalTransactions },
                ...(stats.activeOrders !== undefined ? [{ label: 'Active Orders', value: stats.activeOrders }] : []),
                ...(stats.unresolvedConflicts !== undefined && stats.unresolvedConflicts > 0 ? [{
                    label: 'Inventory Conflicts',
                    value: stats.unresolvedConflicts,
                    badge: { text: 'Needs Attention', className: 'bg-red-500/10 text-red-600 border-red-500/20' }
                }] : [])
            ]
        },
        {
            title: 'Total Revenue',
            value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/20',
            description: 'Cumulative sum of all PAID invoices. This is the gross revenue figure including delivery fees and taxes.',
            popupDetails: [
                {
                    label: 'Revenue Status',
                    value: '',
                    badge: {
                        text: stats.totalRevenue > 0 ? 'Generating' : 'No Transactions',
                        className: stats.totalRevenue > 0 ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }
                },
                { label: 'Total Invoices', value: stats.totalTransactions }
            ]
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cardData.map((card, i) => (
                <StatCardWithPopup
                    key={i}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    bg={card.bg}
                    description={card.description}
                    popupDetails={card.popupDetails}
                />
            ))}
        </div>
    )
}
