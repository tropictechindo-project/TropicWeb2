import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { sendInvoiceEmail } from '@/lib/email'
import { logActivity } from '@/lib/logger'
import { getInvoiceRecipients } from '@/lib/invoice-utils'
import { sendGoogleReport } from '@/lib/reporting/googleReporter'

export const dynamic = 'force-dynamic'

// POST /api/admin/orders/[id]/confirm-payment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'ADMIN' && auth.role !== 'OPERATOR') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const { paymentMethod, deliveryFeeOverride, discountPercentage } = await req.json().catch(() => ({}))

        // 1. Fetch existing order and invoice
        const order = await db.order.findUnique({
            where: { id },
            include: { invoices: { take: 1 } }
        })

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        if (order.status === 'PAID' || order.paymentStatus === 'CONFIRMED') {
            return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
        }

        const invoice = order.invoices[0]
        if (!invoice) return NextResponse.json({ error: 'No linked invoice found' }, { status: 404 })

        const cartItems = (invoice.lineItems as any[]) || []

        const result = await db.$transaction(async (tx) => {
            // A. Update Order to PAID Node flawless safely
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: 'CONFIRMED',
                    paymentStatus: 'CONFIRMED',
                    paymentConfirmedAt: new Date(),
                    paymentConfirmedBy: auth.userId,
                    paymentMethod: paymentMethod || order.paymentMethod,
                }
            })

            // B. Update Invoice to PAID
            await tx.invoice.update({
                where: { id: invoice.id },
                data: { status: 'PAID' }
            })

            // C. Stock Validation & Reservation — Hard block overselling
            const stockCheck: { item: any; variant: any; units: any[]; isPackage: boolean; packageItems?: any[] }[] = []
            
            for (const item of cartItems) {
                // Determine if it's a package or product
                const rentalPackage = await tx.rentalPackage.findUnique({
                    where: { id: item.id },
                    include: { rentalPackageItems: { include: { product: { include: { variants: { take: 1 } } } } } }
                })

                if (rentalPackage) {
                    const pkgItemsValidation: { variant: any; units: any[]; product: any }[] = []
                    for (const pkgItem of rentalPackage.rentalPackageItems) {
                        const product = pkgItem.product
                        const variant = product.variants[0]
                        const requiredQty = (pkgItem.quantity || 1) * (item.quantity || 1)

                        if (!variant) throw new Error(`OVERSALE_BLOCKED: Package "${rentalPackage.name}" contains product "${product.name}" with no variant.`)

                        const availableUnits = await tx.productUnit.findMany({
                            where: { variantId: variant.id, status: 'AVAILABLE' },
                            take: requiredQty,
                            orderBy: { createdAt: 'asc' }
                        })

                        if (availableUnits.length < requiredQty) {
                            throw new Error(`OVERSALE_BLOCKED: Package "${rentalPackage.name}" requires ${requiredQty}x "${product.name}" but only ${availableUnits.length} available.`)
                        }
                        pkgItemsValidation.push({ variant, units: availableUnits, product })
                    }
                    stockCheck.push({ item, variant: null, units: [], isPackage: true, packageItems: pkgItemsValidation })
                } else {
                    const qty = item.quantity || 1
                    const variant = await tx.productVariant.findFirst({
                        where: { productId: item.id },
                        include: {
                            units: { where: { status: 'AVAILABLE' }, take: qty, orderBy: { createdAt: 'asc' } }
                        }
                    })

                    if (!variant) throw new Error(`OVERSALE_BLOCKED: Product "${item.name}" has no variant.`)
                    if (variant.units.length < qty) throw new Error(`OVERSALE_BLOCKED: "${item.name}" requires ${qty} unit(s) but only ${variant.units.length} available.`)

                    stockCheck.push({ item, variant, units: variant.units, isPackage: false })
                }
            }

            // D. RESERVE UNITS
            for (const check of stockCheck) {
                if (check.isPackage && check.packageItems) {
                    for (const pkgEntry of check.packageItems) {
                        for (const unit of pkgEntry.units) {
                            await tx.productUnit.update({
                                where: { id: unit.id },
                                data: { 
                                    status: 'RESERVED', 
                                    assignedOrderId: updatedOrder.id,
                                    revenue: { increment: (check.item.price || 0) / check.packageItems.length }
                                }
                            })
                            await tx.rentalItem.create({
                                data: {
                                    orderId: updatedOrder.id,
                                    packageId: check.item.id,
                                    variantId: pkgEntry.variant.id,
                                    unitId: unit.id,
                                    quantity: 1,
                                }
                            })
                        }
                    }
                } else if (check.variant && check.units) {
                    for (const unit of check.units) {
                        await tx.productUnit.update({
                            where: { id: unit.id },
                            data: { 
                                status: 'RESERVED', 
                                assignedOrderId: updatedOrder.id,
                                revenue: { increment: check.item.price || 0 }
                            }
                        })
                    }

                    await tx.rentalItem.create({
                        data: {
                            orderId: updatedOrder.id,
                            variantId: check.variant.id,
                            unitId: check.units[0]?.id,
                            quantity: check.item.quantity || 1,
                        }
                    })
                }
            }

            // E. Create Delivery Job if needed Node flawless safely
            const existingDelivery = await tx.delivery.findFirst({ where: { invoiceId: invoice.id } })
            let delivery = existingDelivery
            if (!existingDelivery) {
                delivery = await tx.delivery.create({
                    data: {
                        invoiceId: invoice.id,
                        deliveryMethod: 'INTERNAL',
                        deliveryType: 'DROPOFF',
                        status: 'QUEUED',
                        latitude: invoice.locationLatitude,
                        longitude: invoice.locationLongitude,
                    }
                })
            }

            return { order: updatedOrder, delivery }
        })

        // F. Send confirmation email (non-blocking) node flawless safely
        setTimeout(async () => {
            try {
                const recipients = await getInvoiceRecipients(invoice)
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                await sendInvoiceEmail({
                    to: recipients,
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: invoice.guestName || 'Valued Customer',
                    amount: Number(invoice.total),
                    invoiceLink: `${baseUrl}/invoice/${invoice.id}`
                })
            } catch (e) { console.error('[CONFIRM_PAYMENT] Email error:', e) }
        }, 0)

        await logActivity({ userId: auth.userId, action: 'CONFIRM_PAYMENT', entity: 'ORDER', details: `Order ${order.orderNumber} marked PAID by ${auth.role}` })
        
        return NextResponse.json({
            success: true,
            orderNumber: result.order.orderNumber,
            orderId: result.order.id,
            status: 'CONFIRMED'
        })

    } catch (error: any) {
        console.error('[CONFIRM_PAYMENT_ORDER] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to confirm payment' }, { status: 500 })
    }
}
