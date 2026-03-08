import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth/auth-helper'
import { sendInvoiceEmail } from '@/lib/email'
import { logActivity } from '@/lib/logger'
import { getInvoiceRecipients } from '@/lib/invoice-utils'


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

            // C. Reserve stock for EVERY line item
            const rentalItems: any[] = []
            for (const item of cartItems) {
                // Find first available unit for this product's variant
                const variant = await tx.productVariant.findFirst({
                    where: { productId: item.id },
                    include: {
                        units: { where: { status: 'AVAILABLE' }, take: 1, orderBy: { createdAt: 'asc' } }
                    }
                })

                if (!variant) {
                    console.warn(`[CONFIRM_PAYMENT] No variant for product ${item.id} (${item.name}) — skipping reservation`)
                    continue
                }

                const unit = variant.units[0] || null

                if (unit) {
                    // Reserve the unit
                    await tx.productUnit.update({
                        where: { id: unit.id },
                        data: { status: 'RESERVED', assignedOrderId: order.id }
                    })
                    // Log the reservation
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

                // Create RentalItem regardless of stock (handles out-of-stock items gracefully)
                const rentalItem = await tx.rentalItem.create({
                    data: {
                        orderId: order.id,
                        variantId: variant.id,
                        unitId: unit?.id || null,
                        quantity: item.quantity || 1,
                    }
                })
                rentalItems.push(rentalItem)
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

        // H. Send confirmation email (non-blocking)
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
            } catch (e) {
                console.error('[CONFIRM_PAYMENT] Email error:', e)
            }
        }, 0)

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
        return NextResponse.json({ error: error.message || 'Failed to confirm payment' }, { status: 500 })
    }
}
