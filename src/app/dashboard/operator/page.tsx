import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/utils"
import OperatorDashboardClient from "@/components/operator/OperatorDashboardClient"

export const dynamic = 'force-dynamic'

export default async function OperatorDashboardPage() {
    // Auth check — must be OPERATOR
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) redirect('/')

    const payload = await verifyToken(token)
    if (!payload || (payload.role !== 'OPERATOR' && payload.role !== 'ADMIN')) {
        redirect('/')
    }

    // Fetch overview data
    const [pendingInvoices, queuedDeliveries, allOrders, lowStockVariants, workers] = await Promise.all([
        db.invoice.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: { select: { fullName: true, email: true } } }
        }),
        db.delivery.findMany({
            where: { status: { in: ['QUEUED', 'CLAIMED', 'OUT_FOR_DELIVERY'] } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                invoice: { include: { user: { select: { fullName: true } } } },
                claimedByWorker: { select: { fullName: true } },
                vehicle: { select: { name: true } }
            }
        }),
        db.order.findMany({
            where: { status: { in: ['PAID', 'AWAITING_PAYMENT', 'ACTIVE'] } },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { user: { select: { fullName: true, email: true } } }
        }),
        db.productVariant.findMany({
            include: {
                product: { select: { name: true } },
                units: { where: { status: 'AVAILABLE' } }
            },
            take: 50
        }),
        db.user.findMany({
            where: { role: 'WORKER' },
            select: { id: true, fullName: true, email: true, whatsapp: true }
        })
    ])

    const overviewStats = {
        pendingPayments: pendingInvoices.length,
        queuedDeliveries: queuedDeliveries.filter(d => d.status === 'QUEUED').length,
        activeOrders: allOrders.filter(o => o.status === 'ACTIVE' || o.status === 'PAID').length,
        lowStockCount: lowStockVariants.filter(v => v.units.length === 0).length,
    }

    return (
        <OperatorDashboardClient
            operatorName={payload.username || 'Operator'}
            stats={overviewStats}
            pendingInvoices={JSON.parse(JSON.stringify(pendingInvoices))}
            deliveries={JSON.parse(JSON.stringify(queuedDeliveries))}
            orders={JSON.parse(JSON.stringify(allOrders))}
            variants={JSON.parse(JSON.stringify(lowStockVariants))}
            workers={JSON.parse(JSON.stringify(workers))}
        />
    )
}
