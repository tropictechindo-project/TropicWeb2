import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { RealtimeOverview } from "@/components/admin/overview/RealtimeOverview"
import { SystemControl } from "@/components/admin/overview/SystemControl"
import { OverviewCharts } from "@/components/admin/overview/Charts"
import { ActivityLogPanel } from "@/components/admin/ActivityLogPanel"
import { InfoCenter } from "@/components/admin/overview/InfoCenter"
import { ApiStatusPanel } from "@/components/admin/overview/ApiStatusPanel"
import { MessagesCTA } from "@/components/admin/overview/MessagesCTA"

async function getStats() {
    const [
        totalUsers,
        verifiedUsers,
        totalTransactions,
        revenueData,
        notifications,
        totalProducts,
        totalPackages,
        activeOrders,
        unresolvedConflicts,
        lastActivity
    ] = await Promise.all([
        db.user.count(),
        db.$queryRaw<{ count: bigint }[]>`SELECT count(*)::bigint as count FROM users WHERE is_verified = true`,
        db.invoice.count(),
        db.invoice.aggregate({
            _sum: { total: true }
        }),
        db.systemNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        }),
        db.product.count(),
        db.rentalPackage.count(),
        db.order.count({ where: { status: 'ACTIVE' } }),
        db.inventorySyncLog.count({ where: { conflict: true, resolved: false } }),
        db.activityLog.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        })
    ])

    const verifiedCount = Number((verifiedUsers as any)[0]?.count || 0)

    return {
        cards: {
            totalUsers,
            verifiedUsers: verifiedCount,
            totalTransactions,
            totalRevenue: Number(revenueData._sum.total || 0),
            totalProducts,
            totalPackages,
            activeOrders,
            unresolvedConflicts,
            lastUpdate: lastActivity?.createdAt ? lastActivity.createdAt.toISOString() : new Date().toISOString()
        },
        notifications
    }
}

export default async function AdminOverviewPage() {
    const data = await getStats()

    // Mock data for charts
    const mockRevenueData = [
        { name: 'Jan', total: 15000000, count: 12 },
        { name: 'Feb', total: 22000000, count: 18 },
        { name: 'Mar', total: 18000000, count: 15 },
        { name: 'Apr', total: 28000000, count: 24 },
        { name: 'May', total: 35000000, count: 32 },
        { name: 'Jun', total: 42000000, count: 38 },
    ]

    const mockUserData = [
        { name: 'Jan', registered: 20, active: 15 },
        { name: 'Feb', registered: 35, active: 28 },
        { name: 'Mar', registered: 45, active: 40 },
        { name: 'Apr', registered: 60, active: 55 },
        { name: 'May', registered: 85, active: 75 },
        { name: 'Jun', registered: 110, active: 95 },
    ]

    return (
        <div className="pb-10">
            <RealtimeOverview
                initialData={data}
                sidePanel={
                    <div className="space-y-8">
                        <ApiStatusPanel />
                        <SystemControl />
                        <ActivityLogPanel />
                        <MessagesCTA />
                    </div>
                }
            >
                <div className="grid gap-8 grid-cols-1">
                    <div className="space-y-8">
                        <OverviewCharts userData={mockUserData} revenueData={mockRevenueData} />
                    </div>
                    {/* InfoCenter moved below charts, full width */}
                    <div className="space-y-8">
                        {/* We need to pass notifications here, but RealtimeOverview manages state. 
                        We should expose InfoCenter via RealtimeOverview's children or a new prop.
                        Better yet, let RealtimeOverview handle the layout of InfoCenter if it owns the data.
                        
                        Wait, RealtimeOverview currently renders InfoCenter in its own grid. 
                        I should update RealtimeOverview to change where InfoCenter is rendered.
                     */}
                    </div>
                </div>
            </RealtimeOverview>
        </div>
    )
}
