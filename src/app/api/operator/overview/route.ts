import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'

export const dynamic = 'force-dynamic'

/**
 * GET /api/operator/overview
 * Returns the same data as the Operator page's Server Component fetch,
 * used for client-side background polling/refreshing.
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'OPERATOR' && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch overview data (Sync with src/app/dashboard/operator/page.tsx)
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
                            variant: { include: { product: true } },
                            rentalPackage: {
                                include: {
                                    rentalPackageItems: { include: { product: true } }
                                }
                            }
                        }
                    }
                }
            }),
            db.productVariant.findMany({
                include: {
                    product: { select: { name: true, category: true } },
                    units: true
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

        const productAssets = lowStockVariants.map(v => ({
            id: v.id,
            productId: v.productId,
            name: `${v.product.name} (${v.color})`,
            category: (v.product as any).category || 'General',
            total: v.units.length,
            available: v.units.filter(u => u.status === 'AVAILABLE').length,
            reserved: v.units.filter(u => u.status === 'RESERVED').length,
            rented: v.units.filter(u => u.status === 'RENTED').length,
            maintenance: v.units.filter(u => u.status === 'MAINTENANCE').length,
            lost: v.units.filter(u => u.status === 'LOST').length,
            status: (v.units.filter(u => u.status === 'AVAILABLE').length > 0) ? 'HEALTHY' : 'OUT_OF_STOCK'
        }))

        const overviewStats = {
            pendingPayments: pendingInvoices.length,
            queuedDeliveries: queuedDeliveries.filter(d => d.status === 'QUEUED').length,
            activeOrders: allOrders.filter(o => o.status === 'ACTIVE' || o.status === 'PAID').length,
            lowStockCount: lowStockVariants.filter(v => v.units.filter(u => u.status === 'AVAILABLE').length === 0).length,
        }

        return NextResponse.json({
            stats: overviewStats,
            pendingInvoices,
            deliveries: queuedDeliveries,
            orders: formattedOrders,
            productAssets,
            workers,
            variants: lowStockVariants
        })

    } catch (error: any) {
        console.error('[OPERATOR_OVERVIEW_GET]', error)
        return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
    }
}
