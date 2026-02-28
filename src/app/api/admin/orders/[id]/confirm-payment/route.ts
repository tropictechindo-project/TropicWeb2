import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { createInvoiceForOrder, getInvoiceRecipients } from '@/lib/invoice-utils'
import { sendInvoiceEmail } from '@/lib/email'
import { logActivity } from '@/lib/logger'

/**
 * Confirm payment for an order
 * Creates invoice, sends emails, updates order status
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const adminId = payload.userId
        const { paymentMethod, deliveryFeeOverride, discountPercentage } = await request.json()
        const orderId = (await params).id

        // 1. Process as atomic transaction
        const result = await db.$transaction(async (tx) => {
            // A. Create/update invoice first to get final calculated totals
            const invoice = await createInvoiceForOrder(orderId, deliveryFeeOverride, discountPercentage)

            // B. Transition Units from RESERVED to RENTED
            const rentalItems = await tx.rentalItem.findMany({
                where: { orderId },
                include: { unit: true }
            })

            for (const item of rentalItems) {
                if (item.unitId) {
                    await tx.productUnit.update({
                        where: { id: item.unitId },
                        data: { status: 'RENTED' }
                    })

                    await tx.unitHistory.create({
                        data: {
                            unitId: item.unitId,
                            oldStatus: 'RESERVED',
                            newStatus: 'RENTED',
                            details: `Payment confirmed for order ${orderId}`,
                            userId: adminId
                        }
                    })
                }
            }

            // C. Update order payment status and final totals
            const order = await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'PAID',
                    paymentMethod,
                    paymentConfirmedBy: adminId,
                    paymentConfirmedAt: new Date(),
                    status: 'PAID',
                    totalAmount: invoice.total,
                    tax: invoice.tax,
                    discountPercentage: invoice.discountPercentage,
                    discountAmount: invoice.discountAmount,
                    deliveryFee: invoice.deliveryFee
                },
                include: {
                    user: true
                }
            })

            return { order, invoice }
        })

        const { order, invoice } = result

        // Get all recipients
        const recipients = await getInvoiceRecipients(invoice)

        // Generate shareable invoice link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const invoiceLink = `${baseUrl}/invoice/public/${invoice.shareableToken}`
        console.log('Generated Invoice Link:', invoiceLink)
        console.log('Base URL:', baseUrl)

        // Send email to all recipients
        await sendInvoiceEmail({
            to: recipients,
            invoiceNumber: invoice.invoiceNumber,
            customerName: order.user?.fullName || 'Customer',
            amount: parseFloat(invoice.total.toString()),
            invoiceLink
        })

        // Update invoice email status
        await db.invoice.update({
            where: { id: invoice.id },
            data: {
                emailSent: true,
                emailSentAt: new Date()
            }
        })

        // Log activity
        await logActivity({
            userId: adminId,
            action: 'CONFIRM_PAYMENT',
            entity: 'ORDER',
            details: `Confirmed payment for order ${order.orderNumber}`
        })

        return NextResponse.json({
            success: true,
            order,
            invoice,
            emailsSent: recipients.length
        })
    } catch (error) {
        console.error('Payment confirmation error:', error)
        return NextResponse.json(
            { error: 'Failed to confirm payment' },
            { status: 500 }
        )
    }
}
