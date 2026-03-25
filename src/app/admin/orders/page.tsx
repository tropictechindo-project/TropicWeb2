import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

import { OrdersClient } from "@/components/admin/orders/OrdersClient"

export default async function AdminOrdersPage() {
    const orders = await db.order.findMany({
        where: { status: { in: ['PAID', 'AWAITING_PAYMENT', 'ACTIVE', 'PENDING', 'CONFIRMED'] } },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { fullName: true, email: true, whatsapp: true }
            },
            invoices: {
                select: { 
                    id: true, 
                    lineItems: true, 
                    guestName: true, 
                    guestEmail: true, 
                    guestWhatsapp: true,
                    deliveries: {
                        select: { claimedByWorkerId: true, status: true }
                    }
                }
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
            },
            orderItems: true
        } as any
    })

    const formattedOrders = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
        user: order.user ? (order.user.fullName || order.user.email) : (order.invoices?.[0]?.guestName || 'Unknown'),
        email: order.user ? order.user.email : (order.invoices?.[0]?.guestEmail || ''),
        whatsapp: order.user?.whatsapp || order.invoices?.[0]?.guestWhatsapp || '',
        period: `${new Date(order.startDate).toLocaleDateString()} - ${new Date(order.endDate).toLocaleDateString()}`,
        startDate: order.startDate?.toISOString() || new Date().toISOString(),
        endDate: order.endDate?.toISOString() || new Date().toISOString(),
        status: order.status,

        itemCount: (order as any).orderItems && (order as any).orderItems.length > 0 
            ? (order as any).orderItems.length 
            : order.rentalItems?.length || (order.invoices?.[0]?.lineItems as any[])?.length || 0,
        totalAmount: Number(order.totalAmount),
        subtotal: Number(order.subtotal || 0),
        tax: Number(order.tax || 0),
        deliveryFee: Number(order.deliveryFee || 0),
        paymentMethod: order.paymentMethod || 'MANUAL',
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
        invoiceId: order.invoices?.[0]?.id || null,
        items: (order as any).orderItems && (order as any).orderItems.length > 0 
            ? (order as any).orderItems.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                name: item.nameSnapshot,
                quantity: item.quantity,
                type: 'Snapshot',
                price: Number(item.price),
                serialNumber: 'SN-N/A'
            }))
            : order.rentalItems && order.rentalItems.length > 0
                ? order.rentalItems.map((item: any) => ({
                    id: item.id,
                    name: item.variant?.product?.name || item.rentalPackage?.name || 'Unknown Item',
                    quantity: item.quantity || 1,
                    type: item.variant?.product ? 'PRODUCT' : 'PACKAGE',
                    price: Number(item.variant?.product?.monthlyPrice || item.rentalPackage?.price || 0),
                    serialNumber: item.unit?.serialNumber || 'PENDING'
                }))
                : order.invoices?.[0]?.lineItems
                    ? (order.invoices[0].lineItems as any[]).map((item: any) => ({
                        id: item.id || `inv_item_${Math.random()}`,
                        name: item.name || 'Rental Item',
                        quantity: item.quantity || 1,
                        type: 'InvoiceSnapshot',
                        price: Number(item.price || 0),
                        serialNumber: 'N/A'
                    }))
                    : [],
        isClaimed: order.invoices?.some((inv: any) => 
            inv.deliveries?.some((del: any) => del.claimedByWorkerId !== null)
        ) || false,

    }))

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Orders & Rentals</h2>
            <OrdersClient initialOrders={formattedOrders as any} />
        </div>
    )
}
