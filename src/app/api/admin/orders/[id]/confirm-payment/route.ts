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
    { params }: { params: { id: string } }
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
        const { paymentMethod, deliveryFeeOverride } = await request.json()
        const orderId = (await params).id

        // Update order payment status
        const order = await db.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: 'PAID',
                paymentMethod,
                paymentConfirmedBy: adminId,
                paymentConfirmedAt: new Date(),
                status: 'PAID'
            },
            include: {
                user: true
            }
        })

        // Create/update invoice
        const invoice = await createInvoiceForOrder(orderId, deliveryFeeOverride)

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
