import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/upload-proof
 * Updates a transaction with proof of payment and advances order status
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { transactionId, proofUrl } = await request.json()

        if (!transactionId || !proofUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Atomic update of transaction and order status
        const result = await db.$transaction(async (tx) => {
            const transaction = await tx.paymentTransaction.findUnique({
                where: { id: transactionId },
                include: { order: true }
            })

            if (!transaction) throw new Error('Transaction not found')
            if (transaction.order.userId !== payload.userId) throw new Error('Forbidden')

            const updatedTransaction = await tx.paymentTransaction.update({
                where: { id: transactionId },
                data: {
                    status: 'PENDING_VERIFICATION',
                    proofUrl
                }
            })

            const updatedOrder = await tx.order.update({
                where: { id: transaction.orderId },
                data: {
                    status: 'PAYMENT_PENDING_VERIFICATION'
                }
            })

            return { updatedTransaction, updatedOrder }
        })

        return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
        console.error('Payment proof upload error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
