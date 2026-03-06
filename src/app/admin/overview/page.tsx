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

async function getAnalyticsData() {
    const months: { name: string; start: Date; end: Date }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            name: d.toLocaleString('en-US', { month: 'short' }),
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        })
    }

    const [revenueData, userData] = await Promise.all([
        Promise.all(months.map(async (m) => {
            const stats = await db.invoice.aggregate({
                where: {
                    createdAt: { gte: m.start, lte: m.end },
                    status: 'PAID'
                },
                _sum: { total: true },
                _count: { id: true }
            })
            return {
                name: m.name,
                total: Number(stats._sum.total || 0),
                count: stats._count.id
            }
        })),
        Promise.all(months.map(async (m) => {
            const [registered, active] = await Promise.all([
                db.user.count({
                    where: { createdAt: { gte: m.start, lte: m.end } }
                }),
                db.activityLog.groupBy({
                    by: ['userId'],
                    where: {
                        createdAt: { gte: m.start, lte: m.end },
                        userId: { not: null }
                    }
                }).then(res => res.length)
            ])
            return {
                name: m.name,
                registered,
                active
            }
        }))
    ])

    return { revenueData, userData }
}

export default async function AdminOverviewPage() {
    const [data, analytics] = await Promise.all([
        getStats(),
        getAnalyticsData()
    ])

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
                        <OverviewCharts userData={analytics.userData} revenueData={analytics.revenueData} />
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
