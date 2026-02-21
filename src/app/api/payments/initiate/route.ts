import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payments/initiate
 * Creates a new payment transaction entry for an order
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { orderId, provider, amount, currency } = await request.json()

        if (!orderId || !provider || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify order ownership
        const order = await db.order.findUnique({
            where: { id: orderId }
        })

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        if (order.userId !== payload.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Amount Validation
        if (Number(order.totalAmount) !== Number(amount)) {
            return NextResponse.json({
                error: `Amount mismatch. Order total is ${order.totalAmount}, but ${amount} was requested.`
            }, { status: 400 })
        }

        // Create transaction
        const transaction = await (db as any).paymentTransaction.create({
            data: {
                orderId,
                provider, // e.g., 'BANK_TRANSFER', 'STRIPE'
                amount,
                currency: currency || 'IDR',
                status: 'INITIATED'
            }
        })

        return NextResponse.json({
            success: true,
            transactionId: transaction.id,
            instructions: `Please complete your payment via ${provider}.`
        })
    } catch (error) {
        console.error('Payment initiation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
