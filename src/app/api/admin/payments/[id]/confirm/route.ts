import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'
import { logActivity } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/payments/[id]/confirm
 * Admin endpoint to verify a payment proof and confirm the order
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: transactionId } = await params

        // Atomic confirmation
        const result = await db.$transaction(async (tx) => {
            const transaction = await (tx as any).paymentTransaction.findUnique({
                where: { id: transactionId },
                include: {
                    order: {
                        include: {
                            invoice: true,
                            rentalItems: true
                        }
                    }
                }
            })

            if (!transaction) throw new Error('Transaction not found')
            if (transaction.status !== 'PENDING_VERIFICATION') {
                throw new Error('Transaction is not in pending verification state')
            }

            // Amount Validation (Hardening)
            if (Number(transaction.amount) !== Number(transaction.order.totalAmount)) {
                throw new Error(`Amount mismatch error. Transaction: ${transaction.amount}, Order: ${transaction.order.totalAmount}`)
            }

            // 1. Update Transaction
            const updatedTransaction = await (tx as any).paymentTransaction.update({
                where: { id: transactionId },
                data: {
                    status: 'CONFIRMED',
                    verifiedByAdminId: payload.userId,
                    verifiedAt: new Date()
                }
            })

            // 2. Update Order
            const updatedOrder = await tx.order.update({
                where: { id: transaction.orderId },
                data: {
                    status: 'PAID'
                }
            })

            // 3. Deduct Stock Offically & Release Hold
            for (const item of transaction.order.rentalItems) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stockQuantity: { decrement: item.quantity || 0 },
                            reservedQuantity: { decrement: item.quantity || 0 }
                        }
                    })
                }
            }

            // 3. Update Invoice (Safety check: only if exists)
            if (transaction.order.invoice) {
                await tx.invoice.update({
                    where: { id: transaction.order.invoice.id },
                    data: { status: 'PAID' }
                })
            }

            // 4. Log Activity
            await tx.activityLog.create({
                data: {
                    userId: payload.userId,
                    action: 'CONFIRM_PAYMENT',
                    entity: 'ORDER',
                    details: `Confirmed payment transaction ${transactionId} for Order #${transaction.order.orderNumber}. Invoice marked as PAID.`
                }
            })

            return { updatedTransaction, updatedOrder }
        })

        // TODO: Trigger worker assignment logic here

        return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
        console.error('Payment confirmation error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
