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
                invoice: {
                    select: {
                        invoiceNumber: true,
                        guestAddress: true,
                        order: {
                            include: { user: { select: { fullName: true, whatsapp: true } } }
                        }
                    }
                },
                claimedByWorker: { select: { fullName: true, whatsapp: true } },
                vehicle: true,
                items: {
                    include: {
                        rentalItem: {
                            include: {
                                variant: { include: { product: true } },
                                rentalPackage: true
                            }
                        }
                    }
                }
            }
        }),
        db.order.findMany({
            where: { status: { in: ['PAID', 'AWAITING_PAYMENT', 'ACTIVE'] } },
            orderBy: { createdAt: 'desc' },
            take: 20,
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
        }),
        db.productVariant.findMany({
            include: {
                product: { select: { name: true } },
                units: { where: { status: 'AVAILABLE' } }
            },
            take: 50
        }),
        db.user.findMany({
            where: { role: 'WORKER', isActive: true },
            select: { id: true, fullName: true, email: true, whatsapp: true }
        })
    ])

    const formattedOrders = allOrders.map(order => ({
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

    const overviewStats = {
        pendingPayments: pendingInvoices.length,
        queuedDeliveries: queuedDeliveries.filter(d => d.status === 'QUEUED').length,
        activeOrders: allOrders.filter(o => o.status === 'ACTIVE' || o.status === 'PAID').length,
        lowStockCount: lowStockVariants.filter(v => v.units.length === 0).length,
    }

    return (
        <OperatorDashboardClient
            operatorName={typeof payload.username === 'string' ? payload.username : (typeof (payload as any).fullName === 'string' ? (payload as any).fullName : 'Operator')}
            stats={overviewStats}
            pendingInvoices={JSON.parse(JSON.stringify(pendingInvoices))}
            deliveries={JSON.parse(JSON.stringify(queuedDeliveries))}
            orders={JSON.parse(JSON.stringify(formattedOrders))}
            variants={JSON.parse(JSON.stringify(lowStockVariants))}
            workers={JSON.parse(JSON.stringify(workers))}
        />
    )
}
