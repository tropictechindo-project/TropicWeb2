import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { cache } from 'react'

export const dynamic = 'force-dynamic'

// Reusable cached stats to prevent DB hammering from polling
const getCachedStats = cache(async () => {
    return await Promise.all([
        db.user.count(),
        db.user.count({ where: { isVerified: true } }),
        db.invoice.count(),
        db.invoice.aggregate({ _sum: { total: true } }),
        db.product.count(),
        db.rentalPackage.count(),
        db.inventorySyncLog.count({ where: { conflict: true, resolved: false } })
    ])
})

/**
 * Get overall admin dashboard statistics
 * Refreshed in real-time by the dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Get Core Stats (Cached for 60s at react level)
        const [
            totalUsers,
            verifiedUsers,
            totalTransactions,
            revenueData,
            totalProducts,
            totalPackages,
            unresolvedConflicts
        ] = await getCachedStats()

        // 2. Get Real-time specific data (Recent activity)
        const [
            systemNotifications,
            recentOrders,
            recentReports,
            recentMessages,
            dismissedNotifications,
            recentUsers,
            activityLogs,
            activeOrdersCount
        ] = await Promise.all([
            db.systemNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            db.order.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { user: { select: { fullName: true } } }
            }),
            db.delivery.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                take: 10,
                include: { claimedByWorker: { select: { fullName: true } } }
            }),
            db.message.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { sender: { select: { fullName: true } } } }),
            (db as any).notificationDismissal.findMany({ where: { userId: payload.userId } }),
            db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, fullName: true, email: true, createdAt: true } }),
            db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            db.order.count({ where: { status: { in: ['PAID', 'READY_FOR_FULFILLMENT', 'IN_PROGRESS'] as any } } })
        ])

        // create a set of dismissed keys for O(1) lookup
        // @ts-ignore
        const dismissedSet = new Set(dismissedNotifications.map(d => `${d.entityType}:${d.entityId}`))

        // Combine and map notifications
        const combinedNotifications = [
            ...systemNotifications.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                createdAt: n.createdAt,
                entityId: n.id,
                source: 'SYSTEM'
            })),
            ...recentOrders.map(o => ({
                id: o.id,
                type: 'INFO',
                title: 'New Order',
                message: `Order #${o.orderNumber} placed by ${o.user?.fullName || 'Guest'}`,
                createdAt: o.createdAt,
                entityId: o.id,
                source: 'ORDER'
            })),
            ...recentReports.map(d => ({
                id: d.id,
                type: 'SUCCESS',
                title: 'Delivery Completed',
                message: `Delivery completed by ${d.claimedByWorker?.fullName || 'Courier'}`,
                createdAt: d.completedAt || d.updatedAt,
                entityId: d.id,
                source: 'DELIVERY'
            })),
            ...recentMessages.map(m => ({
                id: m.id,
                type: 'INFO',
                title: 'New Message',
                message: `From ${m.sender.fullName}: ${m.content.substring(0, 30)}...`,
                createdAt: m.createdAt,
                entityId: m.id,
                source: 'MESSAGE'
            })),
            ...recentUsers.map(u => ({
                id: u.id,
                type: 'SUCCESS',
                title: 'New User Registered',
                message: `${u.fullName} joined.`,
                createdAt: u.createdAt,
                entityId: u.id,
                source: 'USER'
            })),
            ...activityLogs.map(l => ({
                id: l.id,
                type: 'INFO',
                title: l.action.replace(/_/g, ' '),
                message: `${l.details}`,
                createdAt: l.createdAt,
                entityId: l.id,
                source: 'ACTIVITY'
            }))
        ]
            .filter(n => !dismissedSet.has(`${n.source}:${n.entityId}`))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 50)

        return NextResponse.json({
            stats: {
                totalUsers,
                verifiedUsers,
                totalTransactions,
                totalRevenue: Number(revenueData._sum.total || 0),
                totalProducts,
                totalPackages,
                activeOrders: activeOrdersCount,
                unresolvedConflicts
            },
            notifications: combinedNotifications
        })
    } catch (error) {
        console.error('Admin stats error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        )
    }
}
