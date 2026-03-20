import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { RealtimeOverview } from "@/components/admin/overview/RealtimeOverview"
import { SystemControl } from "@/components/admin/overview/SystemControl"
import { OverviewCharts } from "@/components/admin/overview/Charts"
import { ActivityLogPanel } from "@/components/admin/ActivityLogPanel"
import { InfoCenter } from "@/components/admin/overview/InfoCenter"
import { ApiStatusPanel } from "@/components/admin/overview/ApiStatusPanel"
import { MessagesCTA } from "@/components/admin/overview/MessagesCTA"
import { RoiSummaryPanel } from "@/components/admin/overview/RoiSummaryPanel"

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
        db.order.count({ where: { status: { in: ['ACTIVE', 'PAID', 'PENDING'] } } }),
        db.inventorySyncLog.count({ where: { conflict: true, resolved: false } }),
        db.activityLog.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        })
    ])

    const verifiedCount = Number((verifiedUsers as any)[0]?.count || 0)

    // Serialization Fix: Convert Date objects to strings for Client Component boundary
    const serializedNotifications = notifications.map(n => ({
        ...n,
        createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString()
    }))

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
        notifications: serializedNotifications
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

async function getRoiStats() {
    const [allUnits, orderItems] = await Promise.all([
        (db as any).inventoryUnit.findMany({
            include: { product: { select: { name: true } } }
        }),
        (db as any).orderItem.findMany({
            where: { inventoryUnitId: { not: null } },
            select: { price: true, createdAt: true, inventoryUnitId: true }
        })
    ])

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const total_units = allUnits.length
    const trackedUnitIds = new Set(orderItems.map((item: any) => item.inventoryUnitId))
    const tracked_units = trackedUnitIds.size
    const coverage_percentage = total_units > 0 ? (tracked_units / total_units) * 100 : 0

    const total_earned = orderItems.reduce((sum: number, item: any) => sum + Number(item.price), 0)
    
    const monthly_revenue = orderItems
        .filter((item: any) => item.createdAt && new Date(item.createdAt) >= startOfMonth)
        .reduce((sum: number, item: any) => sum + Number(item.price), 0)

    const total_installment = allUnits
        .filter(u => trackedUnitIds.has(u.id) && u.installmentMonthly !== null)
        .reduce((sum, u) => sum + Number(u.installmentMonthly || 0), 0)

    const net_cashflow = monthly_revenue - total_installment

    const itemsBreakdown = allUnits.map((u: any) => {
        const itemOrders = orderItems.filter((item: any) => item.inventoryUnitId === u.id)
        const earned = itemOrders.reduce((sum: number, item: any) => sum + Number(item.price), 0)
        const monthly = itemOrders
            .filter((item: any) => item.createdAt && new Date(item.createdAt) >= startOfMonth)
            .reduce((sum: number, item: any) => sum + Number(item.price), 0)
        const installment = Number(u.installmentMonthly || 0)

        return {
            id: u.id,
            name: u.product?.name || "Unknown Item",
            serialCode: u.serialCode,
            totalEarned: earned,
            monthlyRevenue: monthly,
            installment: installment,
            netCashflow: monthly - installment
        }
    })

    return {
        total_units,
        tracked_units,
        coverage_percentage,
        total_earned,
        monthly_revenue,
        total_installment,
        net_cashflow,
        itemsBreakdown
    }
}

export default async function AdminOverviewPage() {
    const [data, analytics, roiStats] = await Promise.all([
        getStats(),
        getAnalyticsData(),
        getRoiStats()
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
                        <RoiSummaryPanel roi={roiStats} />
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
