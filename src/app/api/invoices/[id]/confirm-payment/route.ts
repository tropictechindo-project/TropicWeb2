import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { sendInvoiceEmail } from '@/lib/email'
import { logActivity } from '@/lib/logger'
import { getInvoiceRecipients } from '@/lib/invoice-utils'
import { sendGoogleReport } from '@/lib/reporting/googleReporter'


export const dynamic = 'force-dynamic'

// PATCH /api/invoices/[id]/confirm-payment
// Called by Admin or Operator after verifying customer payment.
// This is the trigger for the full order flow:
//   Invoice (PAID) → Order → RentalItems (ALL cart items) → ProductUnit reserved → Delivery (QUEUED)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAuth(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (auth.role !== 'ADMIN' && auth.role !== 'OPERATOR') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const { invoiceId } = await req.json().catch(() => ({ invoiceId: id }))
        const targetId = id || invoiceId

        const invoice = await db.invoice.findUnique({ where: { id: targetId } })
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        if (invoice.status === 'PAID') return NextResponse.json({ error: 'Invoice already paid' }, { status: 409 })

        const cartItems = (invoice.lineItems as any[]) || []
        if (cartItems.length === 0) {
            return NextResponse.json({ error: 'Invoice has no line items. Cannot trigger order flow.' }, { status: 400 })
        }

        const orderNumber = `ORD-${Date.now().toString().slice(-8)}`
        const startDate = new Date()
        const endDate = new Date()
        const duration = cartItems[0]?.duration || 30
        endDate.setDate(startDate.getDate() + duration)

        const result = await db.$transaction(async (tx) => {
            // A. Create Order (now nullable userId — works for guests too)
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    status: 'PAID',
                    totalAmount: invoice.total,
                    subtotal: invoice.subtotal,
                    tax: invoice.tax,
                    deliveryFee: invoice.deliveryFee,
                    paymentMethod: invoice.paymentMethod || 'MANUAL',
                    startDate,
                    endDate,
                    duration,
                    deliveryAddress: invoice.deliveryAddress || invoice.guestAddress,
                    locationLatitude: invoice.locationLatitude,
                    locationLongitude: invoice.locationLongitude,
                    userId: invoice.userId || null,
                    paymentStatus: 'CONFIRMED',
                    paymentConfirmedAt: new Date(),
                    paymentConfirmedBy: auth.userId,
                }
            })

            // B. Link invoice to order
            await tx.invoice.update({
                where: { id: targetId },
                data: { orderId: order.id, status: 'PAID' }
            })

            // C. PRE-VALIDATE STOCK — Hard block overselling
            // Check ALL items have available units BEFORE reserving any
            const stockCheck: { item: any; variant: any; units: any[]; isPackage: boolean; packageItems?: any[] }[] = []
            
            for (const item of cartItems) {
                // Determine if it's a package or product
                const rentalPackage = await tx.rentalPackage.findUnique({
                    where: { id: item.id },
                    include: { rentalPackageItems: { include: { product: { include: { variants: { take: 1 } } } } } }
                })

                if (rentalPackage) {
                    // It's a package! Validate stock for EACH item in the package
                    const pkgItemsValidation: { variant: any; units: any[]; product: any }[] = []
                    for (const pkgItem of rentalPackage.rentalPackageItems) {
                        const product = pkgItem.product
                        const variant = product.variants[0]
                        const requiredQty = (pkgItem.quantity || 1) * (item.quantity || 1)

                        if (!variant) {
                            throw new Error(`OVERSALE_BLOCKED: Package "${rentalPackage.name}" contains product "${product.name}" with no variant configured.`)
                        }

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
                    // It's a single product
                    const qty = item.quantity || 1
                    const variant = await tx.productVariant.findFirst({
                        where: { productId: item.id },
                        include: {
                            units: { where: { status: 'AVAILABLE' }, take: qty, orderBy: { createdAt: 'asc' } }
                        }
                    })

                    if (!variant) {
                        throw new Error(`OVERSALE_BLOCKED: Product "${item.name}" (${item.id}) has no variant configured.`)
                    }

                    if (variant.units.length < qty) {
                        throw new Error(`OVERSALE_BLOCKED: Product "${item.name}" requires ${qty} unit(s) but only ${variant.units.length} available.`)
                    }

                    stockCheck.push({ item, variant, units: variant.units, isPackage: false })
                }
            }

            // D. RESERVE UNITS — All items validated, now lock them
            const rentalItems: any[] = []
            for (const check of stockCheck) {
                if (check.isPackage && check.packageItems) {
                    for (const pkgEntry of check.packageItems) {
                        for (const unit of pkgEntry.units) {
                            await tx.productUnit.update({
                                where: { id: unit.id },
                                data: { 
                                    status: 'RESERVED', 
                                    assignedOrderId: order.id,
                                    revenue: { increment: (check.item.price || 0) / check.packageItems.length } // Simple split for ROI
                                }
                            })
                            await tx.unitHistory.create({
                                data: {
                                    unitId: unit.id,
                                    oldStatus: 'AVAILABLE',
                                    newStatus: 'RESERVED',
                                    details: `Auto-reserved for order ${orderNumber} via package "${check.item.name}"`,
                                    userId: auth.userId
                                }
                            })

                            const ri = await tx.rentalItem.create({
                                data: {
                                    orderId: order.id,
                                    packageId: check.item.id,
                                    variantId: pkgEntry.variant.id,
                                    unitId: unit.id,
                                    quantity: 1,
                                }
                            })
                            rentalItems.push(ri)
                        }
                    }
                } else if (check.variant && check.units) {
                    for (const unit of check.units) {
                        await tx.productUnit.update({
                            where: { id: unit.id },
                            data: { 
                                status: 'RESERVED', 
                                assignedOrderId: order.id,
                                revenue: { increment: check.item.price || 0 }
                            }
                        })
                        await tx.unitHistory.create({
                            data: {
                                unitId: unit.id,
                                oldStatus: 'AVAILABLE',
                                newStatus: 'RESERVED',
                                details: `Auto-reserved for order ${orderNumber} (invoice ${invoice.invoiceNumber})`,
                                userId: auth.userId
                            }
                        })
                    }

                    const rentalItem = await tx.rentalItem.create({
                        data: {
                            orderId: order.id,
                            variantId: check.variant.id,
                            unitId: check.units[0]?.id,
                            quantity: check.item.quantity || 1,
                        }
                    })
                    rentalItems.push(rentalItem)
                }

                const anyTx = tx as any
                await anyTx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: check.isPackage ? null : check.item.id,
                        nameSnapshot: check.item.name || 'Unknown Item',
                        price: check.item.price || 0,
                        quantity: check.item.quantity || 1,
                        rentalStart: startDate,
                        rentalEnd: endDate,
                    }
                })
            }

            // D. Create Delivery Job
            const delivery = await tx.delivery.create({
                data: {
                    invoiceId: targetId,
                    deliveryMethod: 'INTERNAL',
                    deliveryType: 'DROPOFF',
                    status: 'QUEUED',
                    latitude: invoice.locationLatitude,
                    longitude: invoice.locationLongitude,
                }
            })

            // E. Queue 1-hour claim timeout job
            const runAt = new Date()
            runAt.setHours(runAt.getHours() + 1)
            await tx.jobQueue.create({
                data: {
                    type: 'CHECK_DELIVERY_CLAIM',
                    payload: { deliveryId: delivery.id },
                    runAt,
                    status: 'PENDING'
                }
            })

            // F. Notify workers via SPI
            await tx.spiNotification.create({
                data: {
                    role: 'WORKER',
                    type: 'ORDER_CREATED',
                    title: 'New Delivery Assignment',
                    message: `Order ${orderNumber} confirmed and ready for dispatch.`,
                    link: '/dashboard/worker'
                }
            })

            // G. Notify the customer (registered user)
            if (invoice.userId) {
                await tx.spiNotification.create({
                    data: {
                        userId: invoice.userId,
                        role: 'USER',
                        type: 'ORDER_CONFIRMED',
                        title: 'Payment Confirmed! 🎉',
                        message: `Your order ${orderNumber} is confirmed. We are preparing your delivery.`,
                        link: '/dashboard/user'
                    }
                })
            }

            return { order, delivery, rentalItemsCount: rentalItems.length }
        })

        // H. Send confirmation email (Reliable/Blocking for serverless)
        try {
            const recipients = await getInvoiceRecipients(invoice)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tropictech.online'
            
            await sendInvoiceEmail({
                to: recipients,
                invoiceNumber: invoice.invoiceNumber,
                customerName: invoice.guestName || 'Valued Customer',
                amount: Number(invoice.total),
                invoiceLink: `${baseUrl}/invoice/${invoice.id}`,
                trackingLink: `${baseUrl}/tracking/${invoice.invoiceNumber}`,
                isPaid: true,
                invoiceId: invoice.id
            })
        } catch (e) {
            console.error('[CONFIRM_PAYMENT] Email error:', e)
        }
    

        // I. Send Google Report (non-blocking)
        sendGoogleReport('ORDER', {
            orderId: result.order.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.guestName || 'Customer',
            amount: Number(invoice.total),
            paymentMethod: invoice.paymentMethod,
            status: 'PAID',
            timestamp: new Date().toISOString()
        }).catch(err => console.error('[REPORTING_ERROR] Google Sheet Error:', err))

        await logActivity({ userId: auth.userId, action: 'CONFIRM_PAYMENT', entity: 'INVOICE', details: `Invoice ${invoice.invoiceNumber} marked PAID → Order ${result.order.orderNumber} created by ${auth.role}` })
        return NextResponse.json({
            success: true,
            orderNumber: result.order.orderNumber,
            orderId: result.order.id,
            deliveryId: result.delivery.id,
            itemsReserved: result.rentalItemsCount,
        })

    } catch (error: any) {
        console.error('[CONFIRM_PAYMENT] Error:', error)
        if (error.message?.startsWith('OVERSALE_BLOCKED')) {
            return NextResponse.json({ error: error.message, code: 'OVERSALE_BLOCKED' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message || 'Failed to confirm payment' }, { status: 500 })
    }
}
