import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { OrdersClient } from "@/components/admin/orders/OrdersClient"

export default async function AdminOrdersPage() {
    const orders = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { fullName: true, email: true, whatsapp: true }
            },
            rentalItems: true
        }
    })

    const formattedOrders = orders.map(order => ({
        id: order.id,
        user: order.user ? (order.user.fullName || order.user.email) : 'Unknown',
        email: order.user ? order.user.email : '',
        period: `${new Date(order.startDate).toLocaleDateString()} - ${new Date(order.endDate).toLocaleDateString()}`,
        status: order.status,
        itemCount: order.rentalItems.length,
        totalAmount: Number(order.totalAmount)
    }))

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Orders & Rentals</h2>
            <OrdersClient initialOrders={formattedOrders} />
        </div>
    )
}
