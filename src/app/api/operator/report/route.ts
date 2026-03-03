import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/operator/report
// Returns live aggregated report data for the Operator spreadsheet dashboard.
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return new NextResponse('Unauthorized', { status: 401 })
        if (auth.role !== 'OPERATOR' && auth.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // All paid invoices (source of truth)
        const [
            paidInvoices,
            pendingInvoices,
            allOrders,
            deliveries,
            inventorySummary,
            recentLogs,
        ] = await Promise.all([
            db.invoice.findMany({
                where: { status: 'PAID' },
                include: {
                    user: { select: { fullName: true, email: true } },
                    order: { select: { orderNumber: true, status: true } },
                    deliveries: { select: { status: true, claimedByWorker: { select: { fullName: true } } } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
            db.invoice.count({ where: { status: 'PENDING' } }),
            db.order.findMany({
                where: { createdAt: { gte: last30 } },
                select: { status: true, totalAmount: true, createdAt: true }
            }),
            db.delivery.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            db.productVariant.findMany({
                include: {
                    product: { select: { name: true, category: true } },
                    units: { select: { status: true } }
                }
            }),
            db.activityLog.findMany({
                where: { createdAt: { gte: last30 } },
                include: { user: { select: { fullName: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                take: 30
            })
        ])

        // Revenue aggregations
        const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total), 0)
        const totalTax = paidInvoices.reduce((s, i) => s + Number(i.tax), 0)
        const totalDeliveryFees = paidInvoices.reduce((s, i) => s + Number(i.deliveryFee), 0)

        const thisMonthPaid = paidInvoices.filter(i => i.createdAt && new Date(i.createdAt) >= startOfMonth)
        const monthRevenue = thisMonthPaid.reduce((s, i) => s + Number(i.total), 0)

        // Inventory summary
        const inventoryReport = inventorySummary.map(v => ({
            product: v.product.name,
            category: v.product.category,
            sku: v.sku,
            color: v.color,
            available: v.units.filter(u => u.status === 'AVAILABLE').length,
            reserved: v.units.filter(u => u.status === 'RESERVED').length,
            inUse: v.units.filter(u => u.status === 'IN_USE' || u.status === 'RENTED').length,
            maintenance: v.units.filter(u => u.status === 'MAINTENANCE').length,
            total: v.units.length,
        }))

        return NextResponse.json({
            summary: {
                totalRevenue,
                monthRevenue,
                totalTax,
                totalDeliveryFees,
                paidInvoicesCount: paidInvoices.length,
                pendingInvoicesCount: pendingInvoices,
                ordersLast30Days: allOrders.length,
                completedOrders: allOrders.filter(o => o.status === 'COMPLETED').length,
            },
            deliveryStats: deliveries,
            invoices: paidInvoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                customer: inv.user?.fullName || inv.guestName || 'Guest',
                email: inv.user?.email || inv.guestEmail || '—',
                subtotal: Number(inv.subtotal),
                tax: Number(inv.tax),
                deliveryFee: Number(inv.deliveryFee),
                total: Number(inv.total),
                status: inv.status,
                paymentMethod: inv.paymentMethod || '—',
                orderNumber: inv.order?.orderNumber || '—',
                orderStatus: inv.order?.status || '—',
                delivery: inv.deliveries?.[0]?.status || 'NO_DELIVERY',
                worker: inv.deliveries?.[0]?.claimedByWorker?.fullName || '—',
                date: inv.createdAt,
            })),
            inventory: inventoryReport,
            recentActivity: recentLogs.map(l => ({
                id: l.id,
                action: l.action,
                entity: l.entity,
                details: l.details,
                user: l.user?.fullName || 'System',
                role: l.user?.role || 'SYSTEM',
                date: l.createdAt,
            }))
        })

    } catch (error: any) {
        console.error('[OPERATOR_REPORT_GET]', error)
        return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
    }
}
