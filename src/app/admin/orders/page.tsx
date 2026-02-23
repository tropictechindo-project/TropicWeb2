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
            rentalItems: {
                include: {
                    unit: true,
                    variant: {
                        include: {
                            product: true
                        }
                    },
                    rentalPackage: {
                        include: {
                            rentalPackageItems: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    const formattedOrders = orders.map(order => ({
        id: order.id,
        user: order.user ? (order.user.fullName || order.user.email) : 'Unknown',
        email: order.user ? order.user.email : '',
        whatsapp: order.user?.whatsapp || '',
        period: `${new Date(order.startDate).toLocaleDateString()} - ${new Date(order.endDate).toLocaleDateString()}`,
        status: order.status,
        itemCount: order.rentalItems.length,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
        items: order.rentalItems.map(item => ({
            id: item.id,
            name: item.variant?.product?.name || item.rentalPackage?.name || 'Unknown Item',
            quantity: item.quantity,
            type: item.variant?.product ? 'PRODUCT' : 'PACKAGE',
            price: Number(item.variant?.product?.monthlyPrice || item.rentalPackage?.price || 0),
            serialNumber: item.unit?.serialNumber || 'PENDING'
        }))
    }))

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Orders & Rentals</h2>
            <OrdersClient initialOrders={formattedOrders as any} />
        </div>
    )
}
